import { Fornecedor } from "../entities/fornecedor.entity";

export interface FornecedorRepository {
  findAll(clienteId: string): Promise<Fornecedor[]>;
  findById(id: string, clienteId: string): Promise<Fornecedor | null>;
  create(data: Omit<Fornecedor, "id">): Promise<Fornecedor>;
  update(id: string, clienteId: string, data: Partial<Fornecedor>): Promise<Fornecedor>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const FORNECEDOR_REPOSITORY = Symbol("FORNECEDOR_REPOSITORY");
