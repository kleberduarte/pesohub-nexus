import { Imagem } from "../entities/imagem.entity";

export interface ImagemRepository {
  findAll(clienteId: string): Promise<Imagem[]>;
  findById(id: string, clienteId: string): Promise<Imagem | null>;
  create(data: Omit<Imagem, "id">): Promise<Imagem>;
  update(id: string, clienteId: string, data: Partial<Imagem>): Promise<Imagem>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const IMAGEM_REPOSITORY = Symbol("IMAGEM_REPOSITORY");
