import { Operador } from "../entities/operador.entity";

export interface OperadorRepository {
  findAll(clienteId: string): Promise<Operador[]>;
  findById(id: string, clienteId: string): Promise<Operador | null>;
  create(data: Omit<Operador, "id">): Promise<Operador>;
  update(id: string, clienteId: string, data: Partial<Operador>): Promise<Operador>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const OPERADOR_REPOSITORY = Symbol("OPERADOR_REPOSITORY");
