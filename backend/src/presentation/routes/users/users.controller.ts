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
import { validarDominioDeEmail } from "../../../domain/services/email-domain-policy";
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
  @Roles("SUPERADMIN", "ADMIN")
  async list(@Req() req: AuthenticatedRequest) {
    const clienteId = req.user.clienteId;
    if (!clienteId) return [];

    const users = await this.prisma.user.findMany({
      where: { clienteId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        perfil: { select: { nome: true } },
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
    return users.map(({ tokensSenha, passwordChangedAt, ...user }) => ({
      ...user,
      convite: statusConvite(tokensSenha[0], passwordChangedAt),
    }));
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
  @Roles("SUPERADMIN", "ADMIN")
  async desbloquear(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.clienteId !== req.user.clienteId) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (target.role === "SUPERADMIN" && req.user.role !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode desbloquear um usuário SUPERADMIN");
    }

    await this.prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await this.auditLog.record(req, "users.desbloquear", { userId: id, email: target.email });
    return { desbloqueado: true };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN")
  async create(@Body() dto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    const { role: creatorRole, clienteId } = req.user;
    if (!clienteId) {
      throw new ForbiddenException("Selecione uma empresa antes de cadastrar usuários");
    }
    if (dto.role === "SUPERADMIN" && creatorRole !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode cadastrar outro SUPERADMIN");
    }

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
    if (dto.role !== "SUPERADMIN") {
      const empresa = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
      const erroDominio = validarDominioDeEmail(dto.email, empresa?.dominio ?? null, empresa?.nome ?? "esta empresa");
      if (erroDominio) {
        throw new BadRequestException(erroDominio);
      }
    }

    // Restringe o novo usuário a uma única Loja: reaproveita o mecanismo de
    // Perfil (PerfilLojaAcesso) que já existe pra multi-loja, criando um
    // Perfil dedicado "Loja: <nome>" com acesso só àquela Loja. Sem isso, o
    // usuário enxerga (e pode trocar entre) todas as Lojas do Cliente.
    let perfilId: string | null = null;
    if (dto.lojaId) {
      if (dto.role === "SUPERADMIN" || dto.role === "ADMIN") {
        throw new ForbiddenException("ADMIN e SUPERADMIN administram todas as lojas — não é possível restringi-los a uma só");
      }
      const loja = await this.prisma.loja.findFirst({ where: { id: dto.lojaId, clienteId } });
      if (!loja) {
        throw new NotFoundException("Loja não encontrada");
      }
      const perfil = await this.prisma.perfil.upsert({
        where: { clienteId_nome: { clienteId, nome: `Loja: ${loja.nome}` } },
        update: {},
        create: {
          clienteId,
          nome: `Loja: ${loja.nome}`,
          lojas: { create: { lojaId: loja.id } },
        },
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
  @Roles("SUPERADMIN", "ADMIN")
  async reenviarConvite(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const target = await this.buscarConvidado(id, req);
    const conviteEnviado = await this.convites.enviar(target, await this.nomeEmpresa(target.clienteId));
    await this.auditLog.record(req, "users.reenviar_convite", { userId: id, email: target.email, conviteEnviado });
    return { convite: "pendente" as const, conviteEnviado };
  }

  /** Cancela o convite pendente: o link para de funcionar imediatamente. */
  @Delete(":id/convite")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN")
  async cancelarConvite(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
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
    if (!statusConvite(target.tokensSenha[0], target.passwordChangedAt)) {
      throw new BadRequestException("Este usuário não tem convite em aberto.");
    }
    return target;
  }

  private async nomeEmpresa(clienteId: string | null): Promise<string | null> {
    if (!clienteId) return null;
    const empresa = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { nome: true } });
    return empresa?.nome ?? null;
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    const { role: creatorRole, clienteId } = req.user;
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

    const data: {
      role?: typeof dto.role;
      senha?: string;
      mustChangePassword?: boolean;
      passwordChangedAt?: Date;
      senhasAnteriores?: string[];
      failedLoginAttempts?: number;
      lockedUntil?: Date | null;
    } = {};
    if (dto.role) data.role = dto.role;
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
  @Roles("SUPERADMIN", "ADMIN")
  async remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const { sub, role: creatorRole, clienteId } = req.user;
    if (id === sub) {
      throw new ForbiddenException("Você não pode excluir seu próprio usuário");
    }

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.clienteId !== clienteId) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (target.role === "SUPERADMIN" && creatorRole !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode excluir um usuário SUPERADMIN");
    }

    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
