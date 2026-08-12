import { Device } from "../entities/device.entity";

export interface DeviceRepository {
  findAll(lojaId: string): Promise<Device[]>;
  findById(id: string, lojaId: string): Promise<Device | null>;
  create(data: Omit<Device, "id">): Promise<Device>;
  update(id: string, lojaId: string, data: Partial<Device>): Promise<Device>;
  delete(id: string, lojaId: string): Promise<void>;
}

export const DEVICE_REPOSITORY = Symbol("DEVICE_REPOSITORY");
