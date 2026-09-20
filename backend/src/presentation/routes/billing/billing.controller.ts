import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { createHash, timingSafeEqual } from "crypto";
import { BillingService } from "./billing.service";
import { ContratoService } from "./contrato.service";
import { PainelService } from "./painel.service";
import { AuditLogService } from "../../../infrastructure/audit/audit-log.service";
import { CreateAssinaturaDto } from "../../../application/dtos/create-assinatura.dto";
import { UpsertContratoDto } from "../../../application/dtos/upsert-contrato.dto";
import { FecharCompetenciaDto } from "../../../application/dtos/fechar-competencia.dto";
import { Public } from "../../middleware/public.decorator";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { SkipBillingCheck } from "../../middleware/skip-billing-check.decorator";

/** Comparação em tempo constante de dois segredos de tamanhos arbitrários. */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

interface UsuarioAutenticado {
  sub: string;
  role: string;
  clienteId: string;
}

@ApiTags("billing")
@SkipBillingCheck()
@Controller("billing")
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly contratos: ContratoService,
    private readonly painel: PainelService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  @Post("subscribe")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "ADMIN_REDE")
  async subscribe(@Body() dto: CreateAssinaturaDto, @Req() req: Request) {
    const user = this.usuario(req);
    const rede = await this.billing.resolverRede(user, dto.dominioRede);
    return this.billing.subscribe(user.clienteId, rede, dto);
  }

  @Get("status")
  async status(@Req() req: Request, @Query("rede") rede?: string) {
    const user = this.usuario(req);
    const dominio = await this.billing.resolverRede(user, rede);
    return this.billing.status(user.clienteId, dominio);
  }

  /** Assinaturas de todas as redes da empresa — visão de quem administra. */
  @Get("assinaturas")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  assinaturas(@Req() req: Request) {
    return this.billing.listarAssinaturas(this.usuario(req).clienteId);
  }

  @Post("cancel")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "ADMIN_REDE")
  async cancel(@Req() req: Request, @Body() body: { dominioRede?: string }) {
    const user = this.usuario(req);
    const rede = await this.billing.resolverRede(user, body?.dominioRede);
    return this.billing.cancel(user.clienteId, rede);
  }

  // --- Contrato de licenciamento da fabricante (só quem opera o PesoHub) ---

  @Get("contrato")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  contrato(@Req() req: Request) {
    return this.contratos.detalhe(this.usuario(req).clienteId);
  }

  @Post("contrato")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  salvarContrato(@Body() dto: UpsertContratoDto, @Req() req: Request) {
    return this.contratos.upsert(this.usuario(req).clienteId, dto);
  }

  @Get("contrato/apuracao")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  apuracao(@Req() req: Request, @Query("competencia") competencia: string) {
    return this.contratos.apurar(this.usuario(req).clienteId, competencia);
  }

  @Post("contrato/fechar")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  fechar(@Body() body: FecharCompetenciaDto, @Req() req: Request) {
    return this.contratos.fechar(this.usuario(req).clienteId, body.competencia, body.cpfCnpj);
  }

  // --- Painel financeiro do PesoHub (card #98) ---

  /** Todas as assinaturas e contratos da base. Só o SUPERADMIN global. */
  @Get("painel")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  async painelFinanceiro(@Req() req: Request) {
    await this.painel.exigirSuperadminGlobal(this.usuario(req).sub);
    return this.painel.visaoGeral();
  }

  /**
   * Fecha a competência de uma empresa a partir do painel. EMITE COBRANÇA
   * REAL — a tela confirma antes, e aqui a empresa é explícita, para não
   * depender de qual empresa está ativa na sessão.
   */
  @Post("painel/contratos/:clienteId/fechar")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  async fecharPeloPainel(
    @Param("clienteId") clienteId: string,
    @Body() body: FecharCompetenciaDto,
    @Req() req: Request,
  ) {
    await this.painel.exigirSuperadminGlobal(this.usuario(req).sub);
    // Identificador do PesoHub é cuid, não uuid — ParseUUIDPipe recusaria os
    // ids reais. Aqui só se barra lixo antes de ir ao banco.
    if (!/^[a-z0-9_-]{1,40}$/i.test(clienteId)) {
      throw new BadRequestException("Empresa inválida.");
    }

    // Ação de maior consequência da base: dinheiro real em nome de terceiros.
    // Fica registrado quem fechou, de qual empresa e com que resultado.
    await this.auditLog.record(req, "billing.painel.fechar_competencia", {
      clienteId,
      competencia: body.competencia,
      etapa: "solicitado",
    });
    const competencia = await this.contratos.fechar(clienteId, body.competencia, body.cpfCnpj);
    await this.auditLog.record(req, "billing.painel.fechar_competencia", {
      clienteId,
      competencia: body.competencia,
      etapa: "emitido",
      valorTotal: String(competencia.valorTotal),
      status: competencia.status,
    });
    return competencia;
  }

  // Chamado pelo Asaas, que não tem sessão: autentica por token compartilhado
  // no header, verificado abaixo.
  @Public()
  @Post("webhook")
  async webhook(
    @Body() body: { id?: string; event: string; payment: Record<string, unknown> },
    @Headers("asaas-access-token") token: string,
  ) {
    // Falha fechada: sem ASAAS_WEBHOOK_TOKEN configurado o endpoint fica
    // recusando tudo, em vez de aceitar qualquer POST anônimo capaz de marcar
    // assinaturas como pagas. A comparação é em tempo constante pra não
    // vazar o token byte a byte por timing.
    const expected = this.config.get<string>("ASAAS_WEBHOOK_TOKEN");
    if (!expected || !token || !timingSafeEqualStr(token, expected)) {
      throw new UnauthorizedException("Token de webhook inválido");
    }

    await this.billing.handleWebhookEvent(body.id, body.event, body.payment);
    return { received: true };
  }

  private usuario(req: Request): UsuarioAutenticado {
    return (req as unknown as { user: UsuarioAutenticado }).user;
  }
}
