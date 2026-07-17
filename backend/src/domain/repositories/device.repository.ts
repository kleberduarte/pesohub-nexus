import { Device } from "../entities/device.entity";

export interface DeviceRepository {
  findAll(clienteId: string): Promise<Device[]>;
  findById(id: string, clienteId: string): Promise<Device | null>;
  create(data: Omit<Device, "id">): Promise<Device>;
  update(id: string, clienteId: string, data: Partial<Device>): Promise<Device>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const DEVICE_REPOSITORY = Symbol("DEVICE_REPOSITORY");
