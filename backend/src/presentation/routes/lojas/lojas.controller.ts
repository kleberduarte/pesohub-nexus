import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { CreateLojaDto } from "../../../application/dtos/create-loja.dto";
import { UpdateLojaDto } from "../../../application/dtos/update-loja.dto";
import { RolesGuard } from "../../middleware/roles.guard";
import { EscopoAdminGuard, ExigeEmpresaInteira } from "../../middleware/escopo-admin.guard";
import { normalizarDominio } from "../../../domain/services/acesso-por-dominio";
import { revogarUnidadeDaRede, sincronizarPerfilDaRede } from "./perfil-da-rede";
import { BillingService } from "../billing/billing.service";
import { Roles } from "../../middleware/roles.decorator";

@ApiTags("lojas")
@Controller("lojas")
export class LojasController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  @Get()
  async findAll(@Req() req: Request) {
    const clienteId = this.clienteId(req);
    const perfilId = this.perfilId(req);
    // Usuário com Perfil configurado (ex.: restrito a uma única Loja) só
    // enxerga as Lojas liberadas pra ele — sem isso, o dropdown "trocar de
    // loja" e as demais telas expunham todas as Lojas do Cliente pra
    // qualquer um, mesmo alguém cadastrado só pra operar uma Loja específica.
    // Administrador da loja sem perfil de rede: nenhuma loja, nunca todas (card #96).
    if (!perfilId && (req as unknown as { user: { role?: string } }).user.role === "ADMIN_REDE") {
      return [];
    }
    if (perfilId) {
      return this.prisma.loja.findMany({
        where: { clienteId, perfilAcessos: { some: { perfilId } } },
        orderBy: { nome: "asc" },
      });
    }
    return this.prisma.loja.findMany({ where: { clienteId }, orderBy: { nome: "asc" } });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.prisma.loja.findFirst({ where: { id, clienteId: this.clienteId(req) } });
  }

  // Abrir loja nova é decisão da empresa, não de quem gerencia uma delas.
  @Post()
  @UseGuards(RolesGuard, EscopoAdminGuard)
  @Roles("ADMIN", "SUPERADMIN")
  @ExigeEmpresaInteira()
  async create(@Body() dto: CreateLojaDto, @Req() req: Request) {
    const clienteId = this.clienteId(req);
    const dominioEmail = await this.validarDominioEmail(clienteId, dto.dominioEmail);
    const loja = await this.prisma.loja.create({ data: { ...dto, dominioEmail, clienteId } });
    // Unidade nova de uma rede entra no acesso dos funcionários dela (card #96).
    await sincronizarPerfilDaRede(this.prisma, clienteId, dominioEmail);
    // E a rede já nasce com a assinatura aguardando ativação (card #99).
    await this.billing.garantirAssinaturaPendente(clienteId, dominioEmail);
    return loja;
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  async update(@Param("id") id: string, @Body() dto: UpdateLojaDto, @Req() req: Request) {
    const clienteId = this.clienteId(req);
    // Editar é permitido nas PRÓPRIAS lojas: quem tem escopo mexe só no que
    // administra (card #85). Sem isso, o gerente da Loja 1 renomearia a Loja 2
    // — ou mudaria o domínio dela, trocando quem enxerga o quê.
    await this.exigirLojaNoMeuEscopo(req, id);
    const anterior = await this.prisma.loja.findFirst({ where: { id, clienteId }, select: { dominioEmail: true } });
    if (!anterior) {
      return null;
    }
    const data =
      dto.dominioEmail === undefined
        ? dto
        : { ...dto, dominioEmail: await this.validarDominioEmail(clienteId, dto.dominioEmail) };
    await this.prisma.loja.updateMany({ where: { id, clienteId }, data });

    // Trocou de domínio: sai do acesso da rede antiga e entra no da nova, na
    // hora — sem isso o funcionário do supermercado antigo seguiria vendo a loja.
    if (dto.dominioEmail !== undefined && data.dominioEmail !== anterior.dominioEmail) {
      await sincronizarPerfilDaRede(this.prisma, clienteId, anterior.dominioEmail);
      await revogarUnidadeDaRede(this.prisma, clienteId, anterior.dominioEmail, id);
      await sincronizarPerfilDaRede(this.prisma, clienteId, data.dominioEmail);
      await this.billing.garantirAssinaturaPendente(clienteId, data.dominioEmail);
    }
    return this.prisma.loja.findFirst({ where: { id } });
  }

  // Apagar loja também: leva junto balanças, produtos e usuários dela.
  @Delete(":id")
  @HttpCode(204)
  @UseGuards(RolesGuard, EscopoAdminGuard)
  @Roles("ADMIN", "SUPERADMIN")
  @ExigeEmpresaInteira()
  async remove(@Param("id") id: string, @Req() req: Request) {
    const clienteId = this.clienteId(req);
    const loja = await this.prisma.loja.findFirst({ where: { id, clienteId } });
    if (!loja) {
      throw new NotFoundException();
    }

    // Loja não tem onDelete: Cascade pra maioria das relações no schema (só
    // PerfilLojaAcesso tem) — deleteMany direto na Loja quebra com FK violation
    // assim que existe qualquer Device/Product/etc. vinculado. Apaga tudo em
    // ordem (filhos antes de pais) numa transação só, senão fica órfão.
    await this.prisma.$transaction([
      this.prisma.syncJobItem.deleteMany({
        where: {
          OR: [{ product: { lojaId: id } }, { job: { device: { lojaId: id } } }],
        },
      }),
      this.prisma.syncJob.deleteMany({ where: { device: { lojaId: id } } }),
      this.prisma.tabelaNutricionalItem.deleteMany({ where: { tabela: { lojaId: id } } }),
      this.prisma.product.deleteMany({ where: { lojaId: id } }),
      this.prisma.device.deleteMany({ where: { lojaId: id } }),
      this.prisma.deviceGroup.deleteMany({ where: { lojaId: id } }),
      this.prisma.agent.deleteMany({ where: { lojaId: id } }),
      this.prisma.subSetor.deleteMany({ where: { lojaId: id } }),
      this.prisma.setor.deleteMany({ where: { lojaId: id } }),
      this.prisma.fornecedor.deleteMany({ where: { lojaId: id } }),
      this.prisma.alergico.deleteMany({ where: { lojaId: id } }),
      this.prisma.tabelaNutricional.deleteMany({ where: { lojaId: id } }),
      this.prisma.operador.deleteMany({ where: { lojaId: id } }),
      this.prisma.imagem.deleteMany({ where: { lojaId: id } }),
      this.prisma.formatoImpressao.deleteMany({ where: { lojaId: id } }),
      this.prisma.codigoBarrasFormato.deleteMany({ where: { lojaId: id } }),
      this.prisma.textoGlobal.deleteMany({ where: { lojaId: id } }),
      this.prisma.teclaAcessoRapido.deleteMany({ where: { lojaId: id } }),
      this.prisma.specParametro.deleteMany({ where: { lojaId: id } }),
      this.prisma.configuracaoAvancada.deleteMany({ where: { lojaId: id } }),
      this.prisma.perfilLojaAcesso.deleteMany({ where: { lojaId: id } }),
      this.prisma.integracaoVeltrix.deleteMany({ where: { lojaId: id } }),
      this.prisma.loja.delete({ where: { id } }),
    ]);
  }

  /**
   * Domínio de e-mail da loja: vazio vira null, e não pode ser o domínio da
   * própria empresa — isso transformaria toda a equipe da empresa em
   * "funcionário de loja" presa a uma rede.
   */
  private async validarDominioEmail(clienteId: string, bruto: string | undefined): Promise<string | null> {
    const dominio = normalizarDominio(bruto);
    if (!dominio) return null;
    const empresa = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { dominio: true } });
    if (normalizarDominio(empresa?.dominio) === dominio) {
      throw new BadRequestException(
        `@${dominio} é o domínio da própria empresa. Na loja, use o domínio do supermercado.`,
      );
    }
    return dominio;
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }

  private perfilId(req: Request): string | null {
    return (req as unknown as { user: { perfilId?: string | null } }).user.perfilId ?? null;
  }

  /**
   * Garante que a loja está dentro do escopo de quem pede. Perfil nulo =
   * empresa inteira, então quem administra tudo passa direto. O escopo vem do
   * banco, não do token.
   */
  private async exigirLojaNoMeuEscopo(req: Request, lojaId: string) {
    const sub = (req as unknown as { user?: { sub?: string } }).user?.sub;
    if (!sub) throw new ForbiddenException("Sessão inválida");
    const quemPede = await this.prisma.user.findUnique({ where: { id: sub }, select: { perfilId: true } });
    if (!quemPede?.perfilId) return;
    const acesso = await this.prisma.perfilLojaAcesso.findFirst({
      where: { perfilId: quemPede.perfilId, lojaId },
      select: { id: true },
    });
    if (!acesso) throw new ForbiddenException("Esta loja está fora do seu acesso.");
  }
}
