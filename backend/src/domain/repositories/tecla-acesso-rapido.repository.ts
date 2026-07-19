import { TeclaAcessoRapido } from "../entities/tecla-acesso-rapido.entity";

export interface TeclaAcessoRapidoRepository {
  findAll(clienteId: string): Promise<TeclaAcessoRapido[]>;
  findById(id: string, clienteId: string): Promise<TeclaAcessoRapido | null>;
  create(data: Omit<TeclaAcessoRapido, "id">): Promise<TeclaAcessoRapido>;
  update(id: string, clienteId: string, data: Partial<TeclaAcessoRapido>): Promise<TeclaAcessoRapido>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const TECLA_ACESSO_RAPIDO_REPOSITORY = Symbol("TECLA_ACESSO_RAPIDO_REPOSITORY");
