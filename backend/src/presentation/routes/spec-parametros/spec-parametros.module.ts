import { Module } from "@nestjs/common";
import { SpecParametrosController } from "./spec-parametros.controller";
import { SPEC_PARAMETRO_REPOSITORY } from "../../../domain/repositories/spec-parametro.repository";
import { SpecParametroPrismaRepository } from "../../../infrastructure/database/spec-parametro.prisma.repository";

@Module({
  controllers: [SpecParametrosController],
  providers: [{ provide: SPEC_PARAMETRO_REPOSITORY, useClass: SpecParametroPrismaRepository }],
  exports: [SPEC_PARAMETRO_REPOSITORY],
})
export class SpecParametrosModule {}
