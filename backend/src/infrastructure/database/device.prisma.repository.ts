import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Device } from "../../domain/entities/device.entity";
import {
  DeviceRepository,
  DeviceStats,
  PaginatedResult,
  SlotEtiquetaOcupado,
} from "../../domain/repositories/device.repository";

@Injectable()
export class DevicePrismaRepository implements DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSlotsEtiquetaOcupados(lojaId: string): Promise<SlotEtiquetaOcupado[]> {
    const devices = await this.prisma.device.findMany({
      where: { lojaId, slotsEtiquetaLidosEm: { not: null } },
      select: { id: true, nome: true, slotsEtiqueta: true, slotsEtiquetaLidosEm: true },
    });

    const ocupados: SlotEtiquetaOcupado[] = [];
    for (const device of devices) {
      // Coluna Json: veio do agente já validada, mas o banco não garante forma
      // — um registro torto não pode derrubar a listagem inteira.
      const slots = Array.isArray(device.slotsEtiqueta) ? device.slotsEtiqueta : [];
      for (const slot of slots as { numero?: unknown; nome?: unknown }[]) {
        if (!Number.isInteger(slot?.numero)) continue;
        ocupados.push({
          numero: slot.numero as number,
          nome: String(slot.nome ?? ""),
          deviceId: device.id,
          deviceNome: device.nome,
          lidosEm: device.slotsEtiquetaLidosEm as Date,
        });
      }
    }
    return ocupados;
  }

  findAll(lojaId: string): Promise<Device[]> {
    return this.prisma.device.findMany({ where: { lojaId } });
  }

  async findAllPaginated(lojaId: string, page: number, pageSize: number): Promise<PaginatedResult<Device>> {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.device.findMany({
        where: { lojaId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.device.count({ where: { lojaId } }),
    ]);
    return { data, total, page, pageSize };
  }

  async findLinkedDeviceIds(lojaId: string): Promise<string[]> {
    const devices = await this.prisma.device.findMany({
      where: { lojaId, agentId: { not: null } },
      select: { id: true },
    });
    return devices.map((d) => d.id);
  }

  async countStats(lojaId: string): Promise<DeviceStats> {
    const [total, online] = await this.prisma.$transaction([
      this.prisma.device.count({ where: { lojaId } }),
      this.prisma.device.count({ where: { lojaId, status: "ONLINE" } }),
    ]);
    return { total, online };
  }

  findById(id: string, lojaId: string): Promise<Device | null> {
    return this.prisma.device.findFirst({ where: { id, lojaId } });
  }

  create(data: Omit<Device, "id">): Promise<Device> {
    return this.prisma.device.create({ data });
  }

  async update(id: string, lojaId: string, data: Partial<Device>): Promise<Device> {
    const result = await this.prisma.device.updateMany({ where: { id, lojaId }, data });
    if (result.count === 0) {
      throw new NotFoundException("Balança não encontrada.");
    }
    return this.prisma.device.findFirst({ where: { id, lojaId } }) as Promise<Device>;
  }

  async delete(id: string, lojaId: string): Promise<void> {
    const device = await this.prisma.device.findFirst({ where: { id, lojaId } });
    if (!device) {
      throw new NotFoundException("Balança não encontrada.");
    }
    await this.prisma.$transaction([
      this.prisma.syncJobItem.deleteMany({ where: { job: { deviceId: id } } }),
      this.prisma.syncJob.deleteMany({ where: { deviceId: id } }),
      this.prisma.device.delete({ where: { id } }),
    ]);
  }
}
