import { SpecParametro } from "../entities/spec-parametro.entity";

export interface SpecParametroRepository {
  findAll(lojaId: string): Promise<SpecParametro[]>;
  upsert(clienteId: string, lojaId: string, numero: number, valor: string): Promise<SpecParametro>;
}

export const SPEC_PARAMETRO_REPOSITORY = Symbol("SPEC_PARAMETRO_REPOSITORY");
