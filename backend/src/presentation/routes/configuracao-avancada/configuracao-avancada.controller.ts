import { Body, Controller, Get, Inject, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { UpsertConfiguracaoAvancadaDto } from "../../../application/dtos/upsert-configuracao-avancada.dto";
import {
  CONFIGURACAO_AVANCADA_REPOSITORY,
  ConfiguracaoAvancadaRepository,
} from "../../../domain/repositories/configuracao-avancada.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("configuracao-avancada")
@UseGuards(JwtAuthGuard)
@Controller("configuracao-avancada")
export class ConfiguracaoAvancadaController {
  constructor(
    @Inject(CONFIGURACAO_AVANCADA_REPOSITORY) private readonly config: ConfiguracaoAvancadaRepository,
  ) {}

  @Get()
  find(@Req() req: Request) {
    return this.config.findByCliente(this.clienteId(req));
  }

  @Put()
  upsert(@Body() dto: UpsertConfiguracaoAvancadaDto, @Req() req: Request) {
    return this.config.upsert(this.clienteId(req), dto);
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
