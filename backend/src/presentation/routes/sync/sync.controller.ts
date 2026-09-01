import { BadRequestException, Body, Controller, Get, Inject, NotFoundException, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Request } from "express";
import { CreateSyncJobDto } from "../../../application/dtos/create-sync-job.dto";
import { DEVICE_REPOSITORY, DeviceRepository } from "../../../domain/repositories/device.repository";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { AuditLogService } from "../../../infrastructure/audit/audit-log.service";

@ApiTags("sync")
@UseGuards(JwtAuthGuard)
@Controller("sync")
export class SyncController {
  constructor(
    @InjectQueue("sync-jobs") private readonly syncQueue: Queue,
    @Inject(DEVICE_REPOSITORY) private readonly devices: DeviceRepository,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Post()
  async create(@Body() dto: CreateSyncJobDto, @Req() req: Request) {
    const lojaId = this.lojaId(req);

    // Uma query só para validar a posse do lote inteiro — o Promise.all de
    // findById fazia uma ida ao banco por device (até 500 por requisição).
    const owned = await this.prisma.device.findMany({
      where: { id: { in: dto.deviceIds }, lojaId },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((d) => d.id));
    const notOwned = dto.deviceIds.filter((id) => !ownedIds.has(id));
    if (notOwned.length > 0) {
      throw new BadRequestException(
        `Dispositivo(s) não encontrado(s) ou não pertencem à sua empresa: ${notOwned.join(", ")}`,
      );
    }

    const jobs = await Promise.all(
      dto.deviceIds.map((deviceId) =>
        this.syncQueue.add("sync-device", { deviceId, tipo: dto.tipo, productIds: dto.productIds }),
      ),
    );

    await this.auditLog.record(req, "sync.trigger", {
      deviceIds: dto.deviceIds,
      tipo: dto.tipo,
      productIds: dto.productIds,
    });

    return { queued: jobs.map((j) => j.id) };
  }

  @Get(":deviceId")
  async status(@Param("deviceId") deviceId: string, @Req() req: Request) {
    const device = await this.devices.findById(deviceId, this.lojaId(req));
    if (!device) throw new NotFoundException("Dispositivo não encontrado.");

    const jobs = await this.prisma.syncJob.findMany({
      where: { deviceId },
      orderBy: { id: "desc" },
      take: 20,
      include: { items: { include: { product: { select: { nome: true, codigo: true } } } } },
    });

    return { deviceId, jobs };
  }

  private lojaId(req: Request): string {
    return (req as unknown as { user: { lojaId: string } }).user.lojaId;
  }
}
