import { FormatoImpressao } from "../entities/formato-impressao.entity";

export interface FormatoImpressaoRepository {
  findAll(clienteId: string): Promise<FormatoImpressao[]>;
  findById(id: string, clienteId: string): Promise<FormatoImpressao | null>;
  create(data: Omit<FormatoImpressao, "id">): Promise<FormatoImpressao>;
  update(id: string, clienteId: string, data: Partial<FormatoImpressao>): Promise<FormatoImpressao>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const FORMATO_IMPRESSAO_REPOSITORY = Symbol("FORMATO_IMPRESSAO_REPOSITORY");
