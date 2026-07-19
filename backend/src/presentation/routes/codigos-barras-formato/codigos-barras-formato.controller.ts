import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateCodigoBarrasFormatoDto } from "../../../application/dtos/create-codigo-barras-formato.dto";
import { UpdateCodigoBarrasFormatoDto } from "../../../application/dtos/update-codigo-barras-formato.dto";
import {
  CODIGO_BARRAS_FORMATO_REPOSITORY,
  CodigoBarrasFormatoRepository,
} from "../../../domain/repositories/codigo-barras-formato.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("codigos-barras-formato")
@UseGuards(JwtAuthGuard)
@Controller("codigos-barras-formato")
export class CodigosBarrasFormatoController {
  constructor(
    @Inject(CODIGO_BARRAS_FORMATO_REPOSITORY) private readonly codigos: CodigoBarrasFormatoRepository,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.codigos.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.codigos.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateCodigoBarrasFormatoDto, @Req() req: Request) {
    return this.codigos.create({ ...dto, verificador: dto.verificador ?? 0, clienteId: this.clienteId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCodigoBarrasFormatoDto, @Req() req: Request) {
    return this.codigos.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.codigos.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
