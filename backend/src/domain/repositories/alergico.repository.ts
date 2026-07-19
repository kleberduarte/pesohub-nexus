import { Alergico } from "../entities/alergico.entity";

export interface AlergicoRepository {
  findAll(clienteId: string): Promise<Alergico[]>;
  findById(id: string, clienteId: string): Promise<Alergico | null>;
  create(data: Omit<Alergico, "id">): Promise<Alergico>;
  update(id: string, clienteId: string, data: Partial<Alergico>): Promise<Alergico>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const ALERGICO_REPOSITORY = Symbol("ALERGICO_REPOSITORY");
