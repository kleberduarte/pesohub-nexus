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
      lote: dto.lote ?? null,
      unidadeVenda: dto.unidadeVenda ?? "PESO",
      tara: dto.tara ?? null,
      taraPorCento: dto.taraPorCento ?? false,
      pesoFixo: dto.pesoFixo ?? false,
      desconto: dto.desconto ?? null,
      modoEspecial: dto.modoEspecial ?? 0,
      subSetorId: dto.subSetorId ?? null,
      tabelaNutricionalId: dto.tabelaNutricionalId ?? null,
      fornecedorId: dto.fornecedorId ?? null,
      alergicoId: dto.alergicoId ?? null,
      imagemId: dto.imagemId ?? null,
      formatoImpressaoId: dto.formatoImpressaoId ?? null,
      codigoBarrasFormatoId: dto.codigoBarrasFormatoId ?? null,
      bandeiraCodigoBarras: dto.bandeiraCodigoBarras ?? null,
      textoExtra1: dto.textoExtra1 ?? null,
      textoExtra2: dto.textoExtra2 ?? null,
      textoExtra3: dto.textoExtra3 ?? null,
      textoExtra4: dto.textoExtra4 ?? null,
      textoExtra5: dto.textoExtra5 ?? null,
      textoExtra6: dto.textoExtra6 ?? null,
      textoExtra7: dto.textoExtra7 ?? null,
      diasDeVenda: dto.diasDeVenda ?? null,
      tempoDeVenda: dto.tempoDeVenda ?? null,
      validadePacote: dto.validadePacote ?? null,
      validadePacoteHoras: dto.validadePacoteHoras ?? null,
      validadeDias: dto.validadeDias ?? null,
    });

    if (product.ativo) {
      await this.syncDispatcher.syncToLinkedDevices(product.id, clienteId);
    }

    return product;
  }
}
