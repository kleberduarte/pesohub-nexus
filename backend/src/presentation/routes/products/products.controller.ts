import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateProductUseCase } from "../../../application/usecases/create-product.usecase";
import { UpdateProductUseCase } from "../../../application/usecases/update-product.usecase";
import { CreateProductDto } from "../../../application/dtos/create-product.dto";
import { UpdateProductDto } from "../../../application/dtos/update-product.dto";
import { PRODUCT_REPOSITORY, ProductRepository } from "../../../domain/repositories/product.repository";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
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

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.updateProduct.execute(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.products.delete(id);
  }
}
