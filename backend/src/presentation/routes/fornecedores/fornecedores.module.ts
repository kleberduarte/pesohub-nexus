import { Module } from "@nestjs/common";
import { FornecedoresController } from "./fornecedores.controller";
import { FORNECEDOR_REPOSITORY } from "../../../domain/repositories/fornecedor.repository";
import { FornecedorPrismaRepository } from "../../../infrastructure/database/fornecedor.prisma.repository";

@Module({
  controllers: [FornecedoresController],
  providers: [{ provide: FORNECEDOR_REPOSITORY, useClass: FornecedorPrismaRepository }],
  exports: [FORNECEDOR_REPOSITORY],
})
export class FornecedoresModule {}
