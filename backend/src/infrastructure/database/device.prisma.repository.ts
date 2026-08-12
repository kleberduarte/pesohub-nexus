import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Device } from "../../domain/entities/device.entity";
import { DeviceRepository } from "../../domain/repositories/device.repository";

@Injectable()
export class DevicePrismaRepository implements DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(lojaId: string): Promise<Device[]> {
    return this.prisma.device.findMany({ where: { lojaId } });
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
