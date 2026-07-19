import { Module } from "@nestjs/common";
import { SubSetoresController } from "./sub-setores.controller";
import { SUB_SETOR_REPOSITORY } from "../../../domain/repositories/sub-setor.repository";
import { SubSetorPrismaRepository } from "../../../infrastructure/database/sub-setor.prisma.repository";

@Module({
  controllers: [SubSetoresController],
  providers: [{ provide: SUB_SETOR_REPOSITORY, useClass: SubSetorPrismaRepository }],
  exports: [SUB_SETOR_REPOSITORY],
})
export class SubSetoresModule {}
