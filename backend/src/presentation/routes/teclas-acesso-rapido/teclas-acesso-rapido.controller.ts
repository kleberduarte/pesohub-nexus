import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateTeclaAcessoRapidoDto } from "../../../application/dtos/create-tecla-acesso-rapido.dto";
import { UpdateTeclaAcessoRapidoDto } from "../../../application/dtos/update-tecla-acesso-rapido.dto";
import {
  TECLA_ACESSO_RAPIDO_REPOSITORY,
  TeclaAcessoRapidoRepository,
} from "../../../domain/repositories/tecla-acesso-rapido.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("teclas-acesso-rapido")
@UseGuards(JwtAuthGuard)
@Controller("teclas-acesso-rapido")
export class TeclasAcessoRapidoController {
  constructor(
    @Inject(TECLA_ACESSO_RAPIDO_REPOSITORY) private readonly teclas: TeclaAcessoRapidoRepository,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.teclas.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.teclas.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateTeclaAcessoRapidoDto, @Req() req: Request) {
    return this.teclas.create({ ...dto, clienteId: this.clienteId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTeclaAcessoRapidoDto, @Req() req: Request) {
    return this.teclas.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.teclas.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
