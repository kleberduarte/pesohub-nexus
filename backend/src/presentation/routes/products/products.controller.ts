import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateProductUseCase } from "../../../application/usecases/create-product.usecase";
import { UpdateProductUseCase } from "../../../application/usecases/update-product.usecase";
import { CreateProductDto } from "../../../application/dtos/create-product.dto";
import { UpdateProductDto } from "../../../application/dtos/update-product.dto";
import { PRODUCT_REPOSITORY, ProductRepository } from "../../../domain/repositories/product.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { AuditLogService } from "../../../infrastructure/audit/audit-log.service";

@ApiTags("products")
@UseGuards(JwtAuthGuard)
@Controller("products")
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    const lojaId = this.lojaId(req);
    if (!lojaId) return [];
    return this.products.findAll(lojaId);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.products.findById(id, this.requireLojaId(req));
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: Request) {
    return this.createProduct.execute(this.clienteId(req), this.requireLojaId(req), dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto, @Req() req: Request) {
    return this.updateProduct.execute(id, this.requireLojaId(req), dto);
  }

  @Delete()
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  async removeAll(@Req() req: Request) {
    const lojaId = this.lojaId(req);
    const count = lojaId ? await this.products.deleteAll(lojaId) : 0;
    await this.auditLog.record(req, "products.delete_all", { count });
    return { deleted: count };
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.products.delete(id, this.requireLojaId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }

  private lojaId(req: Request): string | null {
    return (req as unknown as { user: { lojaId: string | null } }).user.lojaId;
  }

  /** Sessões de empresa sem nenhuma Loja cadastrada ainda têm `lojaId` null
   * (ver `AuthService.resolveEffectiveLoja`) — sem isso, o Prisma estoura
   * "Argument lojaId must not be null" (500 cru) em vez de uma mensagem
   * clara pedindo pra criar uma loja primeiro. */
  private requireLojaId(req: Request): string {
    const lojaId = this.lojaId(req);
    if (!lojaId) throw new BadRequestException("Nenhuma loja associada à sua sessão. Crie uma loja primeiro.");
    return lojaId;
  }
}
