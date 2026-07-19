import { Module } from "@nestjs/common";
import { ImagensController } from "./imagens.controller";
import { IMAGEM_REPOSITORY } from "../../../domain/repositories/imagem.repository";
import { ImagemPrismaRepository } from "../../../infrastructure/database/imagem.prisma.repository";

@Module({
  controllers: [ImagensController],
  providers: [{ provide: IMAGEM_REPOSITORY, useClass: ImagemPrismaRepository }],
  exports: [IMAGEM_REPOSITORY],
})
export class ImagensModule {}
