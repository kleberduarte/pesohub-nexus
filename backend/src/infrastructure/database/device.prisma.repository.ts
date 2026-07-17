import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Device } from "../../domain/entities/device.entity";
import { DeviceRepository } from "../../domain/repositories/device.repository";

@Injectable()
export class DevicePrismaRepository implements DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(clienteId: string): Promise<Device[]> {
    return this.prisma.device.findMany({ where: { clienteId } });
  }

  findById(id: string, clienteId: string): Promise<Device | null> {
    return this.prisma.device.findFirst({ where: { id, clienteId } });
  }

  create(data: Omit<Device, "id">): Promise<Device> {
    return this.prisma.device.create({ data });
  }

  async update(id: string, clienteId: string, data: Partial<Device>): Promise<Device> {
    const result = await this.prisma.device.updateMany({ where: { id, clienteId }, data });
    if (result.count === 0) {
      throw new NotFoundException("Balança não encontrada.");
    }
    return this.prisma.device.findFirst({ where: { id, clienteId } }) as Promise<Device>;
  }

  async delete(id: string, clienteId: string): Promise<void> {
    const device = await this.prisma.device.findFirst({ where: { id, clienteId } });
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
