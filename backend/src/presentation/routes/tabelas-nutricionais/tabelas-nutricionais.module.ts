import { Module } from "@nestjs/common";
import { TabelasNutricionaisController } from "./tabelas-nutricionais.controller";
import { TABELA_NUTRICIONAL_REPOSITORY } from "../../../domain/repositories/tabela-nutricional.repository";
import { TabelaNutricionalPrismaRepository } from "../../../infrastructure/database/tabela-nutricional.prisma.repository";

@Module({
  controllers: [TabelasNutricionaisController],
  providers: [
    { provide: TABELA_NUTRICIONAL_REPOSITORY, useClass: TabelaNutricionalPrismaRepository },
  ],
  exports: [TABELA_NUTRICIONAL_REPOSITORY],
})
export class TabelasNutricionaisModule {}
