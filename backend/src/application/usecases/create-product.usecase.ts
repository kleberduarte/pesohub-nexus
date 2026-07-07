import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { PRODUCT_REPOSITORY, ProductRepository } from "../../domain/repositories/product.repository";
import { isValidEan13 } from "../../domain/services/ean13.validator";
import { CreateProductDto } from "../dtos/create-product.dto";

@Injectable()
export class CreateProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository) {}

  async execute(dto: CreateProductDto) {
    if (!isValidEan13(dto.codigoBarras)) {
      throw new BadRequestException("Código de barras EAN-13 inválido (dígito verificador incorreto)");
    }
    return this.products.create({
      codigo: dto.codigo,
      codigoBarras: dto.codigoBarras,
      nome: dto.nome,
      preco: dto.preco,
      categoriaImposto: dto.categoriaImposto ?? null,
      ativo: dto.ativo ?? true,
    });
  }
}
