import { Module } from "@nestjs/common";
import { SetoresController } from "./setores.controller";
import { SETOR_REPOSITORY } from "../../../domain/repositories/setor.repository";
import { SetorPrismaRepository } from "../../../infrastructure/database/setor.prisma.repository";

@Module({
  controllers: [SetoresController],
  providers: [{ provide: SETOR_REPOSITORY, useClass: SetorPrismaRepository }],
  exports: [SETOR_REPOSITORY],
})
export class SetoresModule {}
