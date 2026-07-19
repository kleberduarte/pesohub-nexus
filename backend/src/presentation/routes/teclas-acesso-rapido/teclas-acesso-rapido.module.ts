import { Module } from "@nestjs/common";
import { TeclasAcessoRapidoController } from "./teclas-acesso-rapido.controller";
import { TECLA_ACESSO_RAPIDO_REPOSITORY } from "../../../domain/repositories/tecla-acesso-rapido.repository";
import { TeclaAcessoRapidoPrismaRepository } from "../../../infrastructure/database/tecla-acesso-rapido.prisma.repository";

@Module({
  controllers: [TeclasAcessoRapidoController],
  providers: [
    { provide: TECLA_ACESSO_RAPIDO_REPOSITORY, useClass: TeclaAcessoRapidoPrismaRepository },
  ],
  exports: [TECLA_ACESSO_RAPIDO_REPOSITORY],
})
export class TeclasAcessoRapidoModule {}
