import { Module } from "@nestjs/common";
import { ConfiguracaoAvancadaController } from "./configuracao-avancada.controller";
import { CONFIGURACAO_AVANCADA_REPOSITORY } from "../../../domain/repositories/configuracao-avancada.repository";
import { ConfiguracaoAvancadaPrismaRepository } from "../../../infrastructure/database/configuracao-avancada.prisma.repository";

@Module({
  controllers: [ConfiguracaoAvancadaController],
  providers: [
    { provide: CONFIGURACAO_AVANCADA_REPOSITORY, useClass: ConfiguracaoAvancadaPrismaRepository },
  ],
  exports: [CONFIGURACAO_AVANCADA_REPOSITORY],
})
export class ConfiguracaoAvancadaModule {}
