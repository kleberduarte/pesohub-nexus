import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateFormatoImpressaoDto } from "../../../application/dtos/create-formato-impressao.dto";
import { UpdateFormatoImpressaoDto } from "../../../application/dtos/update-formato-impressao.dto";
import {
  FORMATO_IMPRESSAO_REPOSITORY,
  FormatoImpressaoRepository,
} from "../../../domain/repositories/formato-impressao.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("formatos-impressao")
@UseGuards(JwtAuthGuard)
@Controller("formatos-impressao")
export class FormatosImpressaoController {
  constructor(
    @Inject(FORMATO_IMPRESSAO_REPOSITORY) private readonly formatos: FormatoImpressaoRepository,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.formatos.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.formatos.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateFormatoImpressaoDto, @Req() req: Request) {
    return this.formatos.create({ ...dto, tipo: dto.tipo ?? 1, clienteId: this.clienteId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateFormatoImpressaoDto, @Req() req: Request) {
    return this.formatos.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.formatos.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
