import { Device } from "../entities/device.entity";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeviceStats {
  total: number;
  online: number;
}

export interface DeviceRepository {
  findAll(lojaId: string): Promise<Device[]>;
  findAllPaginated(lojaId: string, page: number, pageSize: number): Promise<PaginatedResult<Device>>;
  countStats(lojaId: string): Promise<DeviceStats>;
  findLinkedDeviceIds(lojaId: string): Promise<string[]>;
  findById(id: string, lojaId: string): Promise<Device | null>;
  create(data: Omit<Device, "id">): Promise<Device>;
  update(id: string, lojaId: string, data: Partial<Device>): Promise<Device>;
  delete(id: string, lojaId: string): Promise<void>;
}

export const DEVICE_REPOSITORY = Symbol("DEVICE_REPOSITORY");
