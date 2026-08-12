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
    return this.config.findByLoja(this.lojaId(req));
  }

  @Put()
  upsert(@Body() dto: UpsertConfiguracaoAvancadaDto, @Req() req: Request) {
    return this.config.upsert(this.clienteId(req), this.lojaId(req), dto);
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }

  private lojaId(req: Request): string {
    return (req as unknown as { user: { lojaId: string } }).user.lojaId;
  }
}
