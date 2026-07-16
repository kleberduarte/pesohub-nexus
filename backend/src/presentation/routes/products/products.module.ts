import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { CreateProductUseCase } from "../../../application/usecases/create-product.usecase";
import { UpdateProductUseCase } from "../../../application/usecases/update-product.usecase";
import { ProductSyncDispatcher } from "../../../application/services/product-sync-dispatcher.service";
import { PRODUCT_REPOSITORY } from "../../../domain/repositories/product.repository";
import { ProductPrismaRepository } from "../../../infrastructure/database/product.prisma.repository";
import { DevicesModule } from "../devices/devices.module";
import { SyncQueueModule } from "../../../infrastructure/queue/sync-queue.module";

@Module({
  imports: [DevicesModule, SyncQueueModule],
  controllers: [ProductsController],
  providers: [
    CreateProductUseCase,
    UpdateProductUseCase,
    ProductSyncDispatcher,
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
  ],
})
export class ProductsModule {}
