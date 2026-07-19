import { Module } from "@nestjs/common";
import { AlergicosController } from "./alergicos.controller";
import { ALERGICO_REPOSITORY } from "../../../domain/repositories/alergico.repository";
import { AlergicoPrismaRepository } from "../../../infrastructure/database/alergico.prisma.repository";

@Module({
  controllers: [AlergicosController],
  providers: [{ provide: ALERGICO_REPOSITORY, useClass: AlergicoPrismaRepository }],
  exports: [ALERGICO_REPOSITORY],
})
export class AlergicosModule {}
