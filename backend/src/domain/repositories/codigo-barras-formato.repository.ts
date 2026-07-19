import { CodigoBarrasFormato } from "../entities/codigo-barras-formato.entity";

export interface CodigoBarrasFormatoRepository {
  findAll(clienteId: string): Promise<CodigoBarrasFormato[]>;
  findById(id: string, clienteId: string): Promise<CodigoBarrasFormato | null>;
  create(data: Omit<CodigoBarrasFormato, "id">): Promise<CodigoBarrasFormato>;
  update(id: string, clienteId: string, data: Partial<CodigoBarrasFormato>): Promise<CodigoBarrasFormato>;
  delete(id: string, clienteId: string): Promise<void>;
}

export const CODIGO_BARRAS_FORMATO_REPOSITORY = Symbol("CODIGO_BARRAS_FORMATO_REPOSITORY");
