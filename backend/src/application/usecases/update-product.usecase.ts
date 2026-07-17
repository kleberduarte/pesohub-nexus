import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { PRODUCT_REPOSITORY, ProductRepository } from "../../domain/repositories/product.repository";
import { isValidEan13 } from "../../domain/services/ean13.validator";
import { UpdateProductDto } from "../dtos/update-product.dto";
import { ProductSyncDispatcher } from "../services/product-sync-dispatcher.service";

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly syncDispatcher: ProductSyncDispatcher,
  ) {}

  async execute(id: string, clienteId: string, dto: UpdateProductDto) {
    if (dto.codigoBarras && !isValidEan13(dto.codigoBarras)) {
      throw new BadRequestException("Código de barras EAN-13 inválido (dígito verificador incorreto)");
    }

    const product = await this.products.update(id, clienteId, dto);

    if (product.ativo) {
      await this.syncDispatcher.syncToLinkedDevices(product.id, clienteId);
    }

    return product;
  }
}
