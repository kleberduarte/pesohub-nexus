import { ConfiguracaoAvancada } from "../entities/configuracao-avancada.entity";

export interface ConfiguracaoAvancadaRepository {
  findByLoja(lojaId: string): Promise<ConfiguracaoAvancada | null>;
  upsert(
    clienteId: string,
    lojaId: string,
    data: Partial<Omit<ConfiguracaoAvancada, "id" | "clienteId" | "lojaId">>,
  ): Promise<ConfiguracaoAvancada>;
}

export const CONFIGURACAO_AVANCADA_REPOSITORY = Symbol("CONFIGURACAO_AVANCADA_REPOSITORY");
