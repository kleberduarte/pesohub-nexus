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
import { AvisosCobrancaService } from "./avisos-cobranca.service";
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
    private readonly avisos: AvisosCobrancaService,
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

  /**
   * Como pagar uma fatura sem sair do sistema: QR do Pix, copia-e-cola e
   * linha digitável (card #101). Só leitura no Asaas, e só da própria rede.
   */
  @Get("faturas/:id/pagamento")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN", "ADMIN_REDE")
  dadosDePagamento(@Param("id") id: string, @Req() req: Request, @Query("rede") rede?: string) {
    // Id do PesoHub é cuid, não uuid — aqui só se barra lixo antes do banco.
    if (!/^[a-z0-9_-]{1,40}$/i.test(id)) {
      throw new BadRequestException("Fatura inválida.");
    }
    return this.billing.dadosDePagamento(this.usuario(req), id, rede);
  }

  /**
   * Faixa de aviso no topo do sistema (card #100). Qualquer pessoa da rede
   * pode consultar: é o que evita que só quem abre a tela de Assinatura
   * descubra que a cobrança está em atraso.
   */
  @Get("aviso-da-rede")
  avisoDaRede(@Req() req: Request) {
    const user = this.usuario(req);
    return this.billing.avisoDaRede(user);
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
    const user = this.usuario(req);
    await this.painel.exigirSuperadminGlobal(user.sub, user.clienteId);
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
    const user = this.usuario(req);
    await this.painel.exigirSuperadminGlobal(user.sub, user.clienteId);
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

  /**
   * Dispara a rodada de avisos de cobrança na hora (card #100). A rodada
   * automática é diária; este endpoint existe para quem opera o PesoHub não
   * precisar esperar o próximo ciclo. Não emite cobrança nem altera valores:
   * só manda e-mail do que já venceu ou está para vencer, e cada aviso segue
   * saindo uma vez só.
   */
  @Post("avisos/executar")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  async executarAvisos(@Req() req: Request) {
    const user = this.usuario(req);
    await this.painel.exigirSuperadminGlobal(user.sub, user.clienteId);
    const resumo = await this.avisos.rodar();
    await this.auditLog.record(req, "billing.avisos.executar", {
      enviados: String(resumo.enviados),
      falhas: String(resumo.falhas),
      semDestinatario: String(resumo.semDestinatario),
    });
    return resumo;
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
