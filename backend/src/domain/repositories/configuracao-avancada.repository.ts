import { ConfiguracaoAvancada } from "../entities/configuracao-avancada.entity";

export interface ConfiguracaoAvancadaRepository {
  findByCliente(clienteId: string): Promise<ConfiguracaoAvancada | null>;
  upsert(clienteId: string, data: Partial<Omit<ConfiguracaoAvancada, "id" | "clienteId">>): Promise<ConfiguracaoAvancada>;
}

export const CONFIGURACAO_AVANCADA_REPOSITORY = Symbol("CONFIGURACAO_AVANCADA_REPOSITORY");
