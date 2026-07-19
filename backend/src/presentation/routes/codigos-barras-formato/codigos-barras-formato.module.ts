import { Module } from "@nestjs/common";
import { CodigosBarrasFormatoController } from "./codigos-barras-formato.controller";
import { CODIGO_BARRAS_FORMATO_REPOSITORY } from "../../../domain/repositories/codigo-barras-formato.repository";
import { CodigoBarrasFormatoPrismaRepository } from "../../../infrastructure/database/codigo-barras-formato.prisma.repository";

@Module({
  controllers: [CodigosBarrasFormatoController],
  providers: [
    { provide: CODIGO_BARRAS_FORMATO_REPOSITORY, useClass: CodigoBarrasFormatoPrismaRepository },
  ],
  exports: [CODIGO_BARRAS_FORMATO_REPOSITORY],
})
export class CodigosBarrasFormatoModule {}
