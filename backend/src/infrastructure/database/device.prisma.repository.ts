import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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
    try {
      await this.prisma.$transaction([
        this.prisma.syncJobItem.deleteMany({ where: { job: { deviceId: id } } }),
        this.prisma.syncJob.deleteMany({ where: { deviceId: id } }),
        this.prisma.device.delete({ where: { id } }),
      ]);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new ConflictException("Balança não encontrada.");
      }
      throw err;
    }
  }
}
