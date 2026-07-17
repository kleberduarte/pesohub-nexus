import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateProductUseCase } from "../../../application/usecases/create-product.usecase";
import { UpdateProductUseCase } from "../../../application/usecases/update-product.usecase";
import { CreateProductDto } from "../../../application/dtos/create-product.dto";
import { UpdateProductDto } from "../../../application/dtos/update-product.dto";
import { PRODUCT_REPOSITORY, ProductRepository } from "../../../domain/repositories/product.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("products")
@UseGuards(JwtAuthGuard)
@Controller("products")
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.products.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.products.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: Request) {
    return this.createProduct.execute(this.clienteId(req), dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto, @Req() req: Request) {
    return this.updateProduct.execute(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.products.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
