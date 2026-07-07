import { Device } from "../entities/device.entity";

export interface DeviceRepository {
  findAll(): Promise<Device[]>;
  findById(id: string): Promise<Device | null>;
  create(data: Omit<Device, "id">): Promise<Device>;
  update(id: string, data: Partial<Device>): Promise<Device>;
  delete(id: string): Promise<void>;
}

export const DEVICE_REPOSITORY = Symbol("DEVICE_REPOSITORY");
