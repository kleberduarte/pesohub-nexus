import { Module } from "@nestjs/common";
import { FormatosImpressaoController } from "./formatos-impressao.controller";
import { FORMATO_IMPRESSAO_REPOSITORY } from "../../../domain/repositories/formato-impressao.repository";
import { FormatoImpressaoPrismaRepository } from "../../../infrastructure/database/formato-impressao.prisma.repository";

@Module({
  controllers: [FormatosImpressaoController],
  providers: [{ provide: FORMATO_IMPRESSAO_REPOSITORY, useClass: FormatoImpressaoPrismaRepository }],
  exports: [FORMATO_IMPRESSAO_REPOSITORY],
})
export class FormatosImpressaoModule {}
