import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateFornecedorDto } from "../../../application/dtos/create-fornecedor.dto";
import { UpdateFornecedorDto } from "../../../application/dtos/update-fornecedor.dto";
import { FORNECEDOR_REPOSITORY, FornecedorRepository } from "../../../domain/repositories/fornecedor.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("fornecedores")
@UseGuards(JwtAuthGuard)
@Controller("fornecedores")
export class FornecedoresController {
  constructor(@Inject(FORNECEDOR_REPOSITORY) private readonly fornecedores: FornecedorRepository) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.fornecedores.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.fornecedores.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateFornecedorDto, @Req() req: Request) {
    return this.fornecedores.create({ ...dto, clienteId: this.clienteId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateFornecedorDto, @Req() req: Request) {
    return this.fornecedores.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.fornecedores.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
