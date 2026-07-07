import { Body, Controller, Delete, Get, Inject, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateProductUseCase } from "../../../application/usecases/create-product.usecase";
import { CreateProductDto } from "../../../application/dtos/create-product.dto";
import { PRODUCT_REPOSITORY, ProductRepository } from "../../../domain/repositories/product.repository";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  @Get()
  findAll() {
    return this.products.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.products.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.products.delete(id);
  }
}
