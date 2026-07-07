import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { CreateProductUseCase } from "../../../application/usecases/create-product.usecase";
import { PRODUCT_REPOSITORY } from "../../../domain/repositories/product.repository";
import { ProductPrismaRepository } from "../../../infrastructure/database/product.prisma.repository";

@Module({
  controllers: [ProductsController],
  providers: [
    CreateProductUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
  ],
})
export class ProductsModule {}
