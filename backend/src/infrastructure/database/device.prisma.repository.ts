import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Device } from "../../domain/entities/device.entity";
import { DeviceRepository } from "../../domain/repositories/device.repository";

@Injectable()
export class DevicePrismaRepository implements DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Device[]> {
    return this.prisma.device.findMany();
  }

  findById(id: string): Promise<Device | null> {
    return this.prisma.device.findUnique({ where: { id } });
  }

  create(data: Omit<Device, "id">): Promise<Device> {
    return this.prisma.device.create({ data });
  }

  update(id: string, data: Partial<Device>): Promise<Device> {
    return this.prisma.device.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.device.delete({ where: { id } });
  }
}
