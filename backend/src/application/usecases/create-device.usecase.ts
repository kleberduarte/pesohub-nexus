import { Inject, Injectable } from "@nestjs/common";
import { DEVICE_REPOSITORY, DeviceRepository } from "../../domain/repositories/device.repository";
import { CreateDeviceDto } from "../dtos/create-device.dto";

@Injectable()
export class CreateDeviceUseCase {
  constructor(@Inject(DEVICE_REPOSITORY) private readonly devices: DeviceRepository) {}

  async execute(clienteId: string, dto: CreateDeviceDto) {
    return this.devices.create({
      clienteId,
      nome: dto.nome,
      ip: dto.ip,
      porta: dto.porta,
      grupoId: dto.grupoId ?? null,
      status: "NOT_CONFIGURED",
      ultimoAcesso: null,
      agentId: null,
    });
  }
}
