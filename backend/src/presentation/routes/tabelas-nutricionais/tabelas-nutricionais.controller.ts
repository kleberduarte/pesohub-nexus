import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateTabelaNutricionalDto } from "../../../application/dtos/create-tabela-nutricional.dto";
import { UpdateTabelaNutricionalDto } from "../../../application/dtos/update-tabela-nutricional.dto";
import {
  TABELA_NUTRICIONAL_REPOSITORY,
  TabelaNutricionalRepository,
} from "../../../domain/repositories/tabela-nutricional.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("tabelas-nutricionais")
@UseGuards(JwtAuthGuard)
@Controller("tabelas-nutricionais")
export class TabelasNutricionaisController {
  constructor(
    @Inject(TABELA_NUTRICIONAL_REPOSITORY) private readonly tabelas: TabelaNutricionalRepository,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.tabelas.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.tabelas.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateTabelaNutricionalDto, @Req() req: Request) {
    return this.tabelas.create({ ...dto, clienteId: this.clienteId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTabelaNutricionalDto, @Req() req: Request) {
    return this.tabelas.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.tabelas.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
