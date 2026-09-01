import { Device } from "../entities/device.entity";

export { PaginatedResult } from "./pagination";
import { PaginatedResult } from "./pagination";

export interface DeviceStats {
  total: number;
  online: number;
}

/**
 * Um slot de etiqueta ocupado numa balança da loja, com a origem para a tela
 * poder dizer QUAL balança está usando o número.
 */
export interface SlotEtiquetaOcupado {
  numero: number;
  nome: string;
  deviceId: string;
  deviceNome: string;
  /** Quando o mapa daquela balança foi lido. Um mapa velho continua útil, mas
   * a tela precisa mostrar a idade em vez de fingir certeza. */
  lidosEm: Date;
}

export interface DeviceRepository {
  /** Slots ocupados nas balanças da loja, unindo o mapa de cada uma. Balança
   * cujo mapa nunca foi lido simplesmente não contribui — ausência aqui
   * significa "não sei", nunca "está livre". */
  findSlotsEtiquetaOcupados(lojaId: string): Promise<SlotEtiquetaOcupado[]>;
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
