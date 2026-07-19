import { Module } from "@nestjs/common";
import { TextosGlobaisController } from "./textos-globais.controller";
import { TEXTO_GLOBAL_REPOSITORY } from "../../../domain/repositories/texto-global.repository";
import { TextoGlobalPrismaRepository } from "../../../infrastructure/database/texto-global.prisma.repository";

@Module({
  controllers: [TextosGlobaisController],
  providers: [{ provide: TEXTO_GLOBAL_REPOSITORY, useClass: TextoGlobalPrismaRepository }],
  exports: [TEXTO_GLOBAL_REPOSITORY],
})
export class TextosGlobaisModule {}
