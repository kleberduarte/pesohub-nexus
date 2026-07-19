import { Body, Controller, Get, Inject, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { UpsertSpecParametroDto } from "../../../application/dtos/upsert-spec-parametro.dto";
import {
  SPEC_PARAMETRO_REPOSITORY,
  SpecParametroRepository,
} from "../../../domain/repositories/spec-parametro.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("spec-parametros")
@UseGuards(JwtAuthGuard)
@Controller("spec-parametros")
export class SpecParametrosController {
  constructor(
    @Inject(SPEC_PARAMETRO_REPOSITORY) private readonly specParametros: SpecParametroRepository,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.specParametros.findAll(this.clienteId(req));
  }

  @Put()
  upsert(@Body() dto: UpsertSpecParametroDto, @Req() req: Request) {
    return this.specParametros.upsert(this.clienteId(req), dto.numero, dto.valor);
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
