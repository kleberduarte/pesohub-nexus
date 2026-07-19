import { Module } from "@nestjs/common";
import { OperadoresController } from "./operadores.controller";
import { CreateOperadorUseCase } from "../../../application/usecases/create-operador.usecase";
import { UpdateOperadorUseCase } from "../../../application/usecases/update-operador.usecase";
import { OPERADOR_REPOSITORY } from "../../../domain/repositories/operador.repository";
import { OperadorPrismaRepository } from "../../../infrastructure/database/operador.prisma.repository";

@Module({
  controllers: [OperadoresController],
  providers: [
    CreateOperadorUseCase,
    UpdateOperadorUseCase,
    { provide: OPERADOR_REPOSITORY, useClass: OperadorPrismaRepository },
  ],
  exports: [OPERADOR_REPOSITORY],
})
export class OperadoresModule {}
