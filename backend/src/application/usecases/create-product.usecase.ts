import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { PRODUCT_REPOSITORY, ProductRepository } from "../../domain/repositories/product.repository";
import { isValidEan13 } from "../../domain/services/ean13.validator";
import { CreateProductDto } from "../dtos/create-product.dto";
import { ProductSyncDispatcher } from "../services/product-sync-dispatcher.service";

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly syncDispatcher: ProductSyncDispatcher,
  ) {}

  async execute(clienteId: string, dto: CreateProductDto) {
    if (!isValidEan13(dto.codigoBarras)) {
      throw new BadRequestException("Código de barras EAN-13 inválido (dígito verificador incorreto)");
    }
    const product = await this.products.create({
      clienteId,
      codigo: dto.codigo,
      codigoBarras: dto.codigoBarras,
      nome: dto.nome,
      preco: dto.preco,
      categoriaImposto: dto.categoriaImposto ?? null,
      ativo: dto.ativo ?? true,
    });

    if (product.ativo) {
      await this.syncDispatcher.syncToLinkedDevices(product.id, clienteId);
    }

    return product;
  }
}
