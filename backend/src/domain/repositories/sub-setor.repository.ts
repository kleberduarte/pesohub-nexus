import { SubSetor } from "../entities/sub-setor.entity";

export interface SubSetorRepository {
  findAll(clienteId: string): Promise<SubSetor[]>;
  findById(id: string, clienteId: string): Promise<SubSetor | null>;
  create(data: Omit<SubSetor, "id">): Promise<SubSetor>;
  update(id: string, clienteId: string, data: Partial<SubSetor>): Promise<SubSetor>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const SUB_SETOR_REPOSITORY = Symbol("SUB_SETOR_REPOSITORY");
