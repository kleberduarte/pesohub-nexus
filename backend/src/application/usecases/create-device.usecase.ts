import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DEVICE_REPOSITORY, DeviceRepository } from "../../domain/repositories/device.repository";
import { CreateDeviceDto } from "../dtos/create-device.dto";

@Injectable()
export class CreateDeviceUseCase {
  constructor(@Inject(DEVICE_REPOSITORY) private readonly devices: DeviceRepository) {}

  async execute(clienteId: string, lojaId: string, dto: CreateDeviceDto) {
    try {
      return await this.devices.create({
        clienteId,
        lojaId,
        nome: dto.nome,
        ip: dto.ip,
        porta: dto.porta,
        grupoId: dto.grupoId ?? null,
        status: "NOT_CONFIGURED",
        ultimoAcesso: null,
        agentId: null,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(`Já existe uma balança cadastrada com o IP ${dto.ip} nesta loja.`);
      }
      throw err;
    }
  }
}
