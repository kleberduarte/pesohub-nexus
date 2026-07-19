import { TabelaNutricional, TabelaNutricionalItem } from "../entities/tabela-nutricional.entity";

export type TabelaNutricionalInput = Omit<TabelaNutricional, "id" | "itens"> & {
  itens: Omit<TabelaNutricionalItem, "id">[];
};

export interface TabelaNutricionalRepository {
  findAll(clienteId: string): Promise<TabelaNutricional[]>;
  findById(id: string, clienteId: string): Promise<TabelaNutricional | null>;
  create(data: TabelaNutricionalInput): Promise<TabelaNutricional>;
  update(id: string, clienteId: string, data: Partial<TabelaNutricionalInput>): Promise<TabelaNutricional>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const TABELA_NUTRICIONAL_REPOSITORY = Symbol("TABELA_NUTRICIONAL_REPOSITORY");
