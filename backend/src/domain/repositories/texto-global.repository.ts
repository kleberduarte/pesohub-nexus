import { TextoGlobal } from "../entities/texto-global.entity";

export interface TextoGlobalRepository {
  findAll(clienteId: string): Promise<TextoGlobal[]>;
  findById(id: string, clienteId: string): Promise<TextoGlobal | null>;
  create(data: Omit<TextoGlobal, "id">): Promise<TextoGlobal>;
  update(id: string, clienteId: string, data: Partial<TextoGlobal>): Promise<TextoGlobal>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const TEXTO_GLOBAL_REPOSITORY = Symbol("TEXTO_GLOBAL_REPOSITORY");
