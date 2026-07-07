import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { CreateSyncJobDto } from "../../../application/dtos/create-sync-job.dto";

@ApiTags("sync")
@Controller("sync")
export class SyncController {
  constructor(@InjectQueue("sync-jobs") private readonly syncQueue: Queue) {}

  @Post()
  async create(@Body() dto: CreateSyncJobDto) {
    const jobs = await Promise.all(
      dto.deviceIds.map((deviceId) =>
        this.syncQueue.add("sync-device", { deviceId, tipo: dto.tipo, productIds: dto.productIds }),
      ),
    );
    return { queued: jobs.map((j) => j.id) };
  }

  @Get(":deviceId")
  async status(@Param("deviceId") deviceId: string) {
    // Stub: histórico real virá do SyncJob persistido via Prisma (Fase 4).
    return { deviceId, jobs: [] };
  }
}
