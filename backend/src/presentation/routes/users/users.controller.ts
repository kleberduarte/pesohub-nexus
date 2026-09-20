import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { CreateUserDto } from "../../../application/dtos/create-user.dto";
import { UpdateUserDto } from "../../../application/dtos/update-user.dto";
import { acrescentarAoHistorico, validarComplexidade } from "../../../domain/services/password-policy";
import { AuditLogService } from "../../../infrastructure/audit/audit-log.service";
import {
  decidirAcessoPorDominio,
  nomePerfilDaRede,
  nomePerfilDaUnidade,
} from "../../../domain/services/acesso-por-dominio";
import { sincronizarPerfilDaRede } from "../lojas/perfil-da-rede";
import { statusConvite } from "../../../domain/services/token-senha";
import { ConviteService } from "./convite.service";

interface AuthenticatedRequest extends Request {
  user: { sub: string; role: string; clienteId: string | null };
}

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly convites: ConviteService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN", "ADMIN_REDE")
  async list(@Req() req: AuthenticatedRequest) {
    const clienteId = req.user.clienteId;
    if (!clienteId) return [];

    const dominioDaRede = await this.dominioDaRede(req);
    const users = await this.prisma.user.findMany({
      where: {
        clienteId,
        // Administrador da loja só enxerga as pessoas do próprio supermercado.
        ...(dominioDaRede ? { email: { endsWith: `@${dominioDaRede}`, mode: "insensitive" as const } } : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        perfilId: true,
        perfil: { select: { nome: true, lojas: { select: { lojaId: true } } } },
        // Sem isso o administrador não enxerga que a conta de alguém travou —
        // e a pessoa fica só com um "credenciais inválidas" que não explica
        // nada.
        lockedUntil: true,
        mustChangePassword: true,
        passwordChangedAt: true,
        // Só o convite mais recente importa: reenviar invalida os anteriores.
        tokensSenha: {
          where: { tipo: "CONVITE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { usadoEm: true, expiraEm: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Quem administra uma loja não enxerga a empresa inteira (card #85). Sem
    // este recorte, as Fases 1 e 2 dariam a ilusão de resolver: o gerente
    // pararia de trocar de loja e continuaria lendo — e editando — todos os
    // usuários da rede.
    const visiveis = await this.filtrarPeloMeuEscopo(req, users);

    return visiveis.map(({ tokensSenha, passwordChangedAt, perfilId: _perfilId, perfil, ...user }) => ({
      ...user,
      perfil: perfil ? { nome: perfil.nome } : null,
      convite: statusConvite(tokensSenha[0], passwordChangedAt),
    }));
  }

  /**
   * Filtra uma lista de usuários pelo escopo de quem pediu.
   *
   * Regra: quem tem Perfil só enxerga quem está CONTIDO no próprio escopo —
   * todas as lojas do outro precisam estar entre as suas. Usuário sem Perfil
   * enxerga todas as lojas, então nunca está contido em ninguém e some da
   * lista de um administrador restrito. É o mesmo princípio de conter, e não
   * apenas intersectar, que impede um gerente de duas lojas de administrar o
   * gerente da rede inteira.
   *
   * O filtro é em memória de propósito: "subconjunto" não se expressa bem em
   * SQL e a lista é de usuários de uma empresa, não de produtos.
   */
  private async filtrarPeloMeuEscopo<T extends { id: string; perfilId: string | null; perfil: { lojas: { lojaId: string }[] } | null }>(
    req: AuthenticatedRequest,
    usuarios: T[],
  ): Promise<T[]> {
    const quemPede = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { perfilId: true },
    });
    if (!quemPede?.perfilId) return usuarios;

    const minhas = await this.prisma.perfilLojaAcesso.findMany({
      where: { perfilId: quemPede.perfilId },
      select: { lojaId: true },
    });
    const permitidas = new Set(minhas.map((l) => l.lojaId));

    return usuarios.filter((u) => {
      // A própria conta nunca some da lista — some da tela é pior que inútil.
      if (u.id === req.user.sub) return true;
      if (!u.perfilId || !u.perfil) return false;
      return u.perfil.lojas.every((l) => permitidas.has(l.lojaId));
    });
  }

  /**
   * Destrava uma conta bloqueada por tentativas de senha, sem trocar a senha.
   *
   * Antes o único jeito de destravar era definir uma senha nova — o que
   * obrigava o administrador a inventar uma senha e a repassá-la, justamente
   * o hábito que este card veio eliminar. Quem errou a senha e travou continua
   * sabendo a própria senha; só precisa que o cadeado saia.
   */
  @Post(":id/desbloquear")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN", "ADMIN_REDE")
  async desbloquear(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    await this.exigirAlvoNoMeuEscopo(req, id);
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.clienteId !== req.user.clienteId) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (target.role === "SUPERADMIN" && req.user.role !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode desbloquear um usuário SUPERADMIN");
    }
    await this.exigirMesmaRede(req, target.email, target.role);

    await this.prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await this.auditLog.record(req, "users.desbloquear", { userId: id, email: target.email });
    return { desbloqueado: true };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN", "ADMIN_REDE")
  async create(@Body() dto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    const { role: creatorRole, clienteId } = req.user;
    if (!clienteId) {
      throw new ForbiddenException("Selecione uma empresa antes de cadastrar usuários");
    }
    if (dto.role === "SUPERADMIN" && creatorRole !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode cadastrar outro SUPERADMIN");
    }
    // Administrador da loja cadastra só gente do próprio supermercado, e nunca
    // acima dele mesmo (card #96).
    if (creatorRole === "ADMIN_REDE") {
      if (!["ADMIN_REDE", "OPERADOR", "VIEWER"].includes(dto.role)) {
        throw new ForbiddenException("Administrador da loja cadastra apenas Administrador da loja, Operador ou Visualizador");
      }
      const minhaRede = await this.dominioDaRede(req);
      if (dto.email.split("@")[1]?.toLowerCase() !== minhaRede) {
        throw new ForbiddenException(`Você só pode cadastrar e-mails @${minhaRede}.`);
      }
    }

    // Quem administra só algumas lojas não cria alguém mais amplo que si
    // mesmo: sem Perfil, o novo usuário enxergaria a empresa inteira (#85).
    // Fica junto das outras autorizações, antes de qualquer resolução de
    // domínio — é decisão de permissão, não de dados.
    await this.exigirEscopoDoNovoUsuario(req, dto, clienteId);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Já existe um usuário com este e-mail");
    }

    // SUPERADMIN só existe na empresa padrão (PesoHub) — é o perfil "global"
    // que administra a lista de empresas do sistema. Uma empresa cliente
    // (Ramuza, Rede da Avó etc.) se administra inteiramente com ADMIN; não
    // tem por que ter um SUPERADMIN próprio.
    let clienteIdParaUsuario: string | null = clienteId;
    if (dto.role === "SUPERADMIN") {
      const dominio = dto.email.split("@")[1]?.toLowerCase();
      const clienteDoDominio = dominio ? await this.prisma.cliente.findUnique({ where: { dominio } }) : null;
      if (!clienteDoDominio) {
        throw new ConflictException(
          `Nenhuma empresa cadastrada com o domínio @${dominio} — cadastre o domínio da empresa antes de criar este usuário`,
        );
      }
      if (!clienteDoDominio.isDefault) {
        throw new ForbiddenException("O perfil SUPERADMIN só é permitido na empresa padrão");
      }
      clienteIdParaUsuario = null;
    }

    // Mesmo critério de domínio que já valia para o SUPERADMIN, agora para
    // todo mundo: a conta tem que viver no domínio da empresa, que é quem
    // pode revogá-la quando a pessoa sair. Vale só no cadastro — contas
    // antigas fora da regra seguem funcionando até serem aposentadas à mão,
    // para ninguém ser trancado para fora sem aviso.
    //
    // Card #96: além do domínio da empresa, vale o domínio de uma rede de
    // lojas (o supermercado cliente). Quem entra por ele fica preso às lojas
    // daquela rede — ver decidirAcessoPorDominio.
    let perfilId: string | null = null;
    let acessoDeRede = false;
    let dominioDaUnidade: string | null = null;
    if (dto.role !== "SUPERADMIN") {
      const empresa = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
      const lojasComDominio = await this.prisma.loja.findMany({
        where: { clienteId, dominioEmail: { not: null } },
        select: { id: true, dominioEmail: true },
      });
      const acesso = decidirAcessoPorDominio({
        email: dto.email,
        role: dto.role,
        lojaId: dto.lojaId,
        dominioEmpresa: empresa?.dominio ?? null,
        nomeEmpresa: empresa?.nome ?? "esta empresa",
        lojas: lojasComDominio,
      });
      if (acesso.tipo === "recusado") {
        throw new BadRequestException(acesso.erro);
      }
      if (acesso.tipo === "rede" && dto.lojaId) dominioDaUnidade = acesso.dominio;
      if (acesso.tipo === "rede" && !dto.lojaId) {
        perfilId = await sincronizarPerfilDaRede(this.prisma, clienteId, acesso.dominio);
        acessoDeRede = true;
        // Usuário sem Perfil enxerga TODAS as lojas. Para um e-mail de rede
        // isso seria o pior erro possível, então falha em vez de seguir.
        if (!perfilId) {
          throw new BadRequestException(`Nenhuma loja com o domínio @${acesso.dominio}.`);
        }
      }
    }

    // Escopo explícito por Perfil: é o caminho preferido (card #84), porque
    // deixa o administrador reaproveitar um Perfil que já existe em vez de
    // encher a lista com um "Loja: X" por usuário.
    if (dto.perfilId && !acessoDeRede) {
      const perfil = await this.prisma.perfil.findFirst({
        where: { id: dto.perfilId, clienteId },
        select: { id: true },
      });
      // Perfil de outra empresa não existe para quem pede: aceitar o id
      // daria escopo cruzado entre empresas.
      if (!perfil) throw new NotFoundException("Perfil não encontrado");
      perfilId = perfil.id;
    }

    // Atalho antigo: restringe a uma única Loja criando um Perfil dedicado a
    // ela. `perfilId` explícito tem precedência.
    if (dto.lojaId && !perfilId && !acessoDeRede) {
      // SUPERADMIN administra a base inteira e não tem escopo de loja. ADMIN,
      // sim: "ADMIN de loja" é justamente ADMIN + Perfil de uma loja (#83).
      if (dto.role === "SUPERADMIN") {
        throw new ForbiddenException("SUPERADMIN administra todas as empresas — não é possível restringi-lo a uma loja");
      }
      const loja = await this.prisma.loja.findFirst({ where: { id: dto.lojaId, clienteId } });
      if (!loja) {
        throw new NotFoundException("Loja não encontrada");
      }
      // Funcionário de rede preso a uma unidade ganha perfil próprio da rede:
      // se a loja sair da rede, o acesso dele cai sem mexer no da empresa.
      const nome = dominioDaUnidade ? nomePerfilDaUnidade(dominioDaUnidade, loja.nome) : `Loja: ${loja.nome}`;
      const perfil = await this.prisma.perfil.upsert({
        where: { clienteId_nome: { clienteId, nome } },
        update: {},
        create: { clienteId, nome },
      });
      await this.prisma.perfilLojaAcesso.createMany({
        data: [{ perfilId: perfil.id, lojaId: loja.id }],
        skipDuplicates: true,
      });
      perfilId = perfil.id;
    }

    if (dto.convidar) {
      // A conta nasce com uma senha aleatória que ninguém conhece — nem quem
      // criou. Só o link do convite a torna usável (card #91).
      const senhaInutilizavel = await bcrypt.hash(randomBytes(32).toString("base64url"), 10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          senha: senhaInutilizavel,
          role: dto.role,
          clienteId: clienteIdParaUsuario,
          perfilId,
          mustChangePassword: false,
        },
        select: { id: true, email: true, role: true, createdAt: true, perfil: { select: { nome: true } } },
      });
      const conviteEnviado = await this.convites.enviar(user, await this.nomeEmpresa(clienteIdParaUsuario));
      await this.auditLog.record(req, "users.convidar", { userId: user.id, email: user.email, conviteEnviado });
      return { ...user, convite: "pendente" as const, conviteEnviado };
    }

    if (!dto.senha) {
      throw new BadRequestException("Informe a senha inicial ou marque o envio de convite por e-mail.");
    }
    const problemas = validarComplexidade(dto.senha, dto.email);
    if (problemas.length > 0) {
      throw new BadRequestException(problemas.join(" "));
    }

    const senha = await bcrypt.hash(dto.senha, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        senha,
        role: dto.role,
        clienteId: clienteIdParaUsuario,
        perfilId,
        // Quem cria a conta escolhe a primeira senha e portanto a conhece.
        // A troca no primeiro acesso é o que faz a senha voltar a ser
        // conhecida só pelo dono — sem isso não há como responsabilizar
        // ninguém pelo que a conta fizer.
        mustChangePassword: true,
      },
      select: { id: true, email: true, role: true, createdAt: true, perfil: { select: { nome: true } } },
    });
  }

  /**
   * Reenvia o convite (card #91): gera link novo e invalida o anterior. Serve
   * para convite expirado, cancelado ou que não chegou. Recusado para quem já
   * aceitou — aí o caminho é o próprio usuário usar "esqueci minha senha".
   */
  @Post(":id/convite")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN", "ADMIN_REDE")
  async reenviarConvite(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    await this.exigirAlvoNoMeuEscopo(req, id);
    const target = await this.buscarConvidado(id, req);
    const conviteEnviado = await this.convites.enviar(target, await this.nomeEmpresa(target.clienteId));
    await this.auditLog.record(req, "users.reenviar_convite", { userId: id, email: target.email, conviteEnviado });
    return { convite: "pendente" as const, conviteEnviado };
  }

  /** Cancela o convite pendente: o link para de funcionar imediatamente. */
  @Delete(":id/convite")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN", "ADMIN_REDE")
  async cancelarConvite(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    await this.exigirAlvoNoMeuEscopo(req, id);
    const target = await this.buscarConvidado(id, req);
    await this.convites.cancelar(target.id);
    await this.auditLog.record(req, "users.cancelar_convite", { userId: id, email: target.email });
    return { convite: "cancelado" as const };
  }

  /** Usuário da empresa do solicitante cujo convite ainda não foi aceito. */
  private async buscarConvidado(id: string, req: AuthenticatedRequest) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tokensSenha: { where: { tipo: "CONVITE" }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!target || target.clienteId !== req.user.clienteId) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (target.role === "SUPERADMIN" && req.user.role !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode convidar um usuário SUPERADMIN");
    }
    await this.exigirMesmaRede(req, target.email, target.role);
    if (!statusConvite(target.tokensSenha[0], target.passwordChangedAt)) {
      throw new BadRequestException("Este usuário não tem convite em aberto.");
    }
    return target;
  }

  /**
   * Domínio do supermercado do Administrador da loja que está agindo, ou null
   * para quem administra a empresa (card #96). Lido do banco, não do token:
   * o e-mail do solicitante é a fonte do escopo e não viaja no JWT.
   */
  private async dominioDaRede(req: AuthenticatedRequest): Promise<string | null> {
    if (req.user.role !== "ADMIN_REDE") return null;
    const eu = await this.prisma.user.findUnique({ where: { id: req.user.sub }, select: { email: true } });
    const dominio = eu?.email.split("@")[1]?.toLowerCase();
    // Sem domínio conhecido não há escopo — e sem escopo ele veria todos.
    if (!dominio) throw new ForbiddenException("Não foi possível identificar a sua rede de lojas");
    return dominio;
  }

  /** Administrador da loja só age sobre e-mails do próprio supermercado. */
  private async exigirMesmaRede(req: AuthenticatedRequest, email: string, roleDoAlvo: string): Promise<void> {
    const dominio = await this.dominioDaRede(req);
    if (dominio && email.split("@")[1]?.toLowerCase() !== dominio) {
      throw new NotFoundException("Usuário não encontrado");
    }
    // Nem uma conta antiga de Administrador da empresa com o e-mail do
    // supermercado fica ao alcance do Administrador da loja.
    if (dominio && (roleDoAlvo === "ADMIN" || roleDoAlvo === "SUPERADMIN")) {
      throw new ForbiddenException("Administrador da loja não gerencia Administradores da empresa");
    }
  }

  private async nomeEmpresa(clienteId: string | null): Promise<string | null> {
    if (!clienteId) return null;
    const empresa = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { nome: true } });
    return empresa?.nome ?? null;
  }

  /**
   * Um administrador restrito a lojas só cria usuários dentro dessas lojas
   * (card #85). Criar sem Perfil seria criar alguém com mais alcance que ele.
   */
  private async exigirEscopoDoNovoUsuario(
    req: AuthenticatedRequest,
    dto: { perfilId?: string; lojaId?: string },
    clienteId: string | null,
  ) {
    const quemPede = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { perfilId: true },
    });
    if (!quemPede?.perfilId) return;

    if (dto.perfilId) {
      await this.exigirPodeAlterarEscopo(req, { id: "" }, dto.perfilId, clienteId);
      return;
    }
    if (dto.lojaId) {
      const acesso = await this.prisma.perfilLojaAcesso.findFirst({
        where: { perfilId: quemPede.perfilId, lojaId: dto.lojaId },
        select: { id: true },
      });
      if (!acesso) throw new ForbiddenException("Esta loja está fora do seu acesso.");
      return;
    }
    throw new ForbiddenException(
      "Informe a loja ou o perfil do novo usuário: você administra apenas as lojas do seu perfil.",
    );
  }

  /**
   * O usuário alvo está dentro do meu escopo? (card #85)
   *
   * Mesmo critério de conter usado na listagem: quem administra uma loja não
   * edita, destrava nem apaga quem alcança lojas que ele não alcança. Sem
   * isso, esconder da lista seria teatro — bastaria o id na URL.
   */
  private async exigirAlvoNoMeuEscopo(req: AuthenticatedRequest, alvoId: string) {
    if (alvoId === req.user.sub) return;
    const quemPede = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { perfilId: true },
    });
    if (!quemPede?.perfilId) return;

    const [minhas, alvo] = await Promise.all([
      this.prisma.perfilLojaAcesso.findMany({ where: { perfilId: quemPede.perfilId }, select: { lojaId: true } }),
      this.prisma.user.findUnique({
        where: { id: alvoId },
        select: { perfilId: true, perfil: { select: { lojas: { select: { lojaId: true } } } } },
      }),
    ]);
    const permitidas = new Set(minhas.map((l) => l.lojaId));
    const dentro = Boolean(alvo?.perfilId) && (alvo?.perfil?.lojas ?? []).every((l) => permitidas.has(l.lojaId));
    // Mesma resposta de "não existe": quem está fora do escopo não deve nem
    // descobrir que a conta existe.
    if (!dentro) throw new NotFoundException("Usuário não encontrado");
  }

  /**
   * Quem pode mudar o escopo de quem (card #84).
   *
   * Duas regras, ambas contra escalada de privilégio:
   * 1. limpar o Perfil é dar acesso a TODAS as lojas — só quem já tem esse
   *    alcance pode conceder;
   * 2. o Perfil precisa ser da mesma empresa, senão o id vira ponte entre
   *    empresas.
   *
   * Perfis de rede ("Rede: <domínio>") são mantidos automaticamente e não se
   * atribuem à mão — quem os edita quebra o isolamento entre supermercados
   * (card #96).
   */
  private async exigirPodeAlterarEscopo(
    req: AuthenticatedRequest,
    alvo: { id: string },
    perfilPedido: string,
    clienteId: string | null,
  ) {
    const quemPede = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { perfilId: true, role: true },
    });

    if (perfilPedido === "") {
      if (quemPede?.perfilId) {
        throw new ForbiddenException(
          "Você administra apenas as lojas do seu perfil e não pode dar acesso a todas elas.",
        );
      }
      return;
    }

    if (!clienteId) throw new ForbiddenException("Selecione uma empresa antes de alterar o escopo");

    const perfil = await this.prisma.perfil.findFirst({
      where: { id: perfilPedido, clienteId },
      select: { id: true, nome: true, lojas: { select: { lojaId: true } } },
    });
    if (!perfil) throw new NotFoundException("Perfil não encontrado");

    if (perfil.nome.startsWith("Rede: ")) {
      throw new BadRequestException(
        "Perfis de rede são mantidos automaticamente pelo domínio de e-mail e não podem ser atribuídos manualmente.",
      );
    }

    // Quem tem escopo só concede dentro do próprio escopo: um ADMIN da Loja 1
    // não pode mover alguém para a Loja 2, nem para um perfil que a inclua.
    if (quemPede?.perfilId) {
      const minhas = await this.prisma.perfilLojaAcesso.findMany({
        where: { perfilId: quemPede.perfilId },
        select: { lojaId: true },
      });
      const permitidas = new Set(minhas.map((l) => l.lojaId));
      const extrapola = perfil.lojas.some((l) => !permitidas.has(l.lojaId));
      if (extrapola) {
        throw new ForbiddenException("Este perfil inclui lojas fora do seu acesso.");
      }
    }
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN", "ADMIN_REDE")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    const { role: creatorRole, clienteId } = req.user;
    await this.exigirAlvoNoMeuEscopo(req, id);
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.clienteId !== clienteId) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if ((dto.role === "SUPERADMIN" || target.role === "SUPERADMIN") && creatorRole !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode alterar um usuário SUPERADMIN");
    }
    if (dto.role === "SUPERADMIN" && target.clienteId !== null) {
      throw new ForbiddenException("O perfil SUPERADMIN só é permitido na empresa padrão");
    }
    await this.exigirMesmaRede(req, target.email, target.role);
    if (creatorRole === "ADMIN_REDE" && dto.role && !["ADMIN_REDE", "OPERADOR", "VIEWER"].includes(dto.role)) {
      throw new ForbiddenException("Administrador da loja atribui apenas Administrador da loja, Operador ou Visualizador");
    }
    // Quem vira Administrador da loja precisa do e-mail de uma rede — senão
    // ficaria com poder de gestão e sem escopo nenhum.
    if (dto.role === "ADMIN_REDE" && target.role !== "ADMIN_REDE") {
      const perfil = target.perfilId
        ? await this.prisma.perfil.findUnique({ where: { id: target.perfilId }, select: { nome: true } })
        : null;
      const dominioDoAlvo = target.email.split("@")[1]?.toLowerCase() ?? "";
      if (perfil?.nome !== nomePerfilDaRede(dominioDoAlvo)) {
        throw new BadRequestException(
          "Só um usuário com acesso à rede inteira do supermercado pode virar Administrador da loja.",
        );
      }
    }
    // Card #96: funcionário de supermercado (e-mail fora do domínio da
    // empresa) não vira Administrador pela edição — veria todas as redes.
    if (dto.role === "ADMIN" && clienteId) {
      const empresa = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { dominio: true } });
      const dominioDoUsuario = target.email.split("@")[1]?.toLowerCase();
      if (!empresa?.dominio || dominioDoUsuario !== empresa.dominio.toLowerCase()) {
        throw new ForbiddenException(
          `Só e-mails @${empresa?.dominio ?? "da empresa"} podem ser Administrador. Este é um usuário de loja.`,
        );
      }
    }

    const data: {
      role?: typeof dto.role;
      perfilId?: string | null;
      senha?: string;
      mustChangePassword?: boolean;
      passwordChangedAt?: Date;
      senhasAnteriores?: string[];
      failedLoginAttempts?: number;
      lockedUntil?: Date | null;
    } = {};
    if (dto.role) data.role = dto.role;

    // Corrigir o escopo de alguém sem recriar a conta (card #84). Antes, um
    // usuário preso à loja errada só saía dali sendo apagado e cadastrado de
    // novo — e apagar leva junto o histórico de auditoria dele.
    if (dto.perfilId !== undefined) {
      await this.exigirPodeAlterarEscopo(req, target, dto.perfilId, clienteId);
      data.perfilId = dto.perfilId === "" ? null : dto.perfilId;
    }

    if (dto.senha) {
      const problemas = validarComplexidade(dto.senha, target.email);
      if (problemas.length > 0) {
        throw new BadRequestException(problemas.join(" "));
      }
      data.senha = await bcrypt.hash(dto.senha, 10);
      data.senhasAnteriores = acrescentarAoHistorico(target.senhasAnteriores, target.senha);
      data.passwordChangedAt = new Date();
      // Reset feito por um administrador: ele conhece a senha que acabou de
      // definir, então ela só vale até o dono entrar e trocar.
      data.mustChangePassword = true;
      // Um reset de senha também é a forma de destrancar uma conta bloqueada.
      data.failedLoginAttempts = 0;
      data.lockedUntil = null;
      // Com senha definida pelo administrador, um convite em aberto perde o
      // sentido: o link deixa de funcionar (card #91).
      await this.convites.cancelar(id);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, createdAt: true },
    });
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN", "ADMIN_REDE")
  async remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const { sub, role: creatorRole, clienteId } = req.user;
    if (id === sub) {
      throw new ForbiddenException("Você não pode excluir seu próprio usuário");
    }
    await this.exigirAlvoNoMeuEscopo(req, id);

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.clienteId !== clienteId) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (target.role === "SUPERADMIN" && creatorRole !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode excluir um usuário SUPERADMIN");
    }
    await this.exigirMesmaRede(req, target.email, target.role);

    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
