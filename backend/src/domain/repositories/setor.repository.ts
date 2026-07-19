import { Setor } from "../entities/setor.entity";

export interface SetorRepository {
  findAll(clienteId: string): Promise<Setor[]>;
  findById(id: string, clienteId: string): Promise<Setor | null>;
  create(data: Omit<Setor, "id">): Promise<Setor>;
  update(id: string, clienteId: string, data: Partial<Setor>): Promise<Setor>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const SETOR_REPOSITORY = Symbol("SETOR_REPOSITORY");
