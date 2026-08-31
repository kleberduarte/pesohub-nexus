import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { SessionRevocationService } from "../../../infrastructure/auth/session-revocation.service";
import {
  acrescentarAoHistorico,
  reusaSenhaAnterior,
  senhaExpirada,
  validarComplexidade,
} from "../../../domain/services/password-policy";

interface AuthenticatedUser {
  sub: string;
  email: string;
  role: string;
  clienteId: string | null;
  lojaId: string | null;
  perfilId?: string | null;
  scoped?: boolean;
  /** Identificador da sessão, usado pela lista de revogação no logout. */
  jti?: string;
  /** Expiração do token (segundos desde a época), preenchida pelo jsonwebtoken. */
  exp?: number;
}

/** Duração do access token. Coincide com o maxAge do cookie (ver auth-cookie.ts). */
export const TOKEN_TTL = "15m";

/** Falhas de senha consecutivas antes de trancar a conta. */
export const MAX_TENTATIVAS = 5;

/** Quanto tempo a conta fica trancada depois de estourar as tentativas. */
export const BLOQUEIO_MINUTOS = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sessions: SessionRevocationService,
  ) {}

  async login(email: string, senha: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Mesma exceção para usuário inexistente e senha errada: distinguir os dois
    // entrega ao atacante a lista de e-mails válidos.
    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutos = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Conta bloqueada por tentativas de senha incorretas. Tente novamente em ${minutos} min.`,
      );
    }

    if (!(await bcrypt.compare(senha, user.senha))) {
      await this.registrarFalha(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException("Credenciais inválidas");
    }

    // O bloqueio é por conta, não por IP: o rate limit por IP não protege nada
    // numa loja inteira atrás de um IP público — e ainda faz as pessoas se
    // trancarem entre si.
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // A empresa/loja ativa é estado de sessão, não do usuário: sempre parte do
    // escopo padrão da conta. Antes vinha de `user.activeLojaId`, e com conta
    // compartilhada a troca de loja de uma pessoa reaparecia no login da
    // seguinte — que cadastrava produto e sincronizava para a loja errada.
    const scoped = user.role === "SUPERADMIN" && user.clienteId !== null;
    const effectiveClienteId = user.clienteId ?? (await this.clienteInicialDeSuperadmin(user.role));
    const effectiveLojaId = await this.resolveEffectiveLoja(effectiveClienteId, user.perfilId);

    const precisaTrocarSenha = user.mustChangePassword || senhaExpirada(user.passwordChangedAt);

    return this.emitirSessao(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        clienteId: effectiveClienteId,
        lojaId: effectiveLojaId,
        perfilId: user.perfilId,
        scoped,
      },
      { precisaTrocarSenha },
    );
  }

  /**
   * Renova a sessão sem passar pela senha. O `jti` muda a cada renovação, então
   * um token vazado tem validade curta mesmo que a pessoa siga trabalhando.
   */
  async refresh(currentUser: AuthenticatedUser) {
    await this.sessions.revoke(currentUser.jti, currentUser.exp, "troca_de_escopo");
    return this.emitirSessao({
      sub: currentUser.sub,
      email: currentUser.email,
      role: currentUser.role,
      clienteId: currentUser.clienteId,
      lojaId: currentUser.lojaId,
      perfilId: currentUser.perfilId ?? null,
      scoped: currentUser.scoped ?? false,
    });
  }

  async trocarSenha(currentUser: AuthenticatedUser, senhaAtual: string, novaSenha: string) {
    const user = await this.prisma.user.findUnique({ where: { id: currentUser.sub } });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (!(await bcrypt.compare(senhaAtual, user.senha))) {
      throw new UnauthorizedException("Senha atual incorreta");
    }
    if (await bcrypt.compare(novaSenha, user.senha)) {
      throw new BadRequestException("A nova senha precisa ser diferente da atual.");
    }

    const problemas = validarComplexidade(novaSenha, user.email);
    if (problemas.length > 0) {
      throw new BadRequestException(problemas.join(" "));
    }

    if (await reusaSenhaAnterior(novaSenha, user.senhasAnteriores)) {
      throw new BadRequestException("Esta senha já foi usada antes. Escolha uma que você ainda não usou.");
    }

    const hash = await bcrypt.hash(novaSenha, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        senha: hash,
        senhasAnteriores: acrescentarAoHistorico(user.senhasAnteriores, user.senha),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Trocar a senha encerra a sessão antiga e abre uma nova: é o que impede
    // que uma sessão aberta com a senha comprometida continue valendo.
    await this.sessions.revoke(currentUser.jti, currentUser.exp, "troca_de_escopo");
    return this.emitirSessao({
      sub: user.id,
      email: user.email,
      role: user.role,
      clienteId: user.clienteId,
      lojaId: currentUser.lojaId,
      perfilId: user.perfilId,
      scoped: user.role === "SUPERADMIN" && user.clienteId !== null,
    });
  }

  /**
   * Troca a empresa ativa **desta aba**.
   *
   * Não reemite o cookie de propósito: cookie é por navegador, e reemitir aqui
   * faria a troca vazar para todas as outras abas — o bug que este card veio
   * corrigir. O escopo volta no corpo da resposta, a aba guarda em
   * `sessionStorage` e passa a mandá-lo no cabeçalho, onde o guard revalida a
   * cada requisição.
   */
  async switchCompany(currentUser: AuthenticatedUser, clienteId: string) {
    if (currentUser.role !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode trocar de empresa");
    }
    if (currentUser.scoped) {
      throw new ForbiddenException("Seu acesso é restrito à empresa vinculada à sua conta");
    }

    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      throw new NotFoundException("Empresa não encontrada");
    }

    const lojaId = await this.resolveEffectiveLoja(cliente.id, null);

    return {
      user: {
        sub: currentUser.sub,
        email: currentUser.email,
        role: currentUser.role,
        clienteId: cliente.id,
        lojaId,
        // Trocar de empresa é exclusivo de SUPERADMIN "global" (nunca tem
        // Perfil, que é um conceito por-Cliente) — sempre null aqui.
        perfilId: null,
        scoped: false,
        jti: currentUser.jti,
      },
    };
  }

  /**
   * Troca a loja ativa **desta aba**. Mesma lógica do switchCompany: valida o
   * acesso e devolve o escopo, sem tocar no cookie compartilhado.
   */
  async switchLoja(currentUser: AuthenticatedUser, lojaId: string) {
    if (!currentUser.clienteId) {
      throw new ForbiddenException("Nenhuma empresa ativa");
    }

    const loja = await this.prisma.loja.findFirst({ where: { id: lojaId, clienteId: currentUser.clienteId } });
    if (!loja) {
      throw new NotFoundException("Loja não encontrada");
    }

    if (currentUser.role !== "SUPERADMIN" && currentUser.role !== "ADMIN") {
      const permitido = await this.userHasLojaAccess(currentUser.sub, lojaId);
      if (!permitido) {
        throw new ForbiddenException("Seu perfil não tem acesso a esta loja");
      }
    }

    return {
      user: {
        sub: currentUser.sub,
        email: currentUser.email,
        role: currentUser.role,
        clienteId: currentUser.clienteId,
        lojaId,
        perfilId: currentUser.perfilId ?? null,
        scoped: currentUser.scoped ?? false,
        jti: currentUser.jti,
      },
    };
  }

  /**
   * Assina o token e registra a sessão como a única ativa do usuário — é aqui
   * que a sessão única acontece: um login em outro lugar revoga este `jti`.
   */
  private async emitirSessao(
    payload: {
      sub: string;
      email: string;
      role: string;
      clienteId: string | null;
      lojaId: string | null;
      perfilId: string | null;
      scoped: boolean;
    },
    extras: { precisaTrocarSenha?: boolean } = {},
  ) {
    const jti = randomUUID();
    const accessToken = this.jwt.sign({ ...payload, jti }, { expiresIn: TOKEN_TTL });
    const { exp } = this.jwt.decode(accessToken) as { exp: number };
    await this.sessions.registrarSessaoAtiva(payload.sub, jti, exp);
    return {
      accessToken,
      user: { ...payload, jti, ...extras },
    };
  }

  private async registrarFalha(userId: string, falhasAtuais: number): Promise<void> {
    const falhas = falhasAtuais + 1;
    const trancar = falhas >= MAX_TENTATIVAS;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: trancar ? 0 : falhas,
        lockedUntil: trancar ? new Date(Date.now() + BLOQUEIO_MINUTOS * 60_000) : null,
      },
    });
  }

  /**
   * ADMIN/SUPERADMIN sem perfil configurado enxergam todas as lojas do Cliente
   * (dono da conta). Usuários com um Perfil ficam restritos às lojas daquele
   * perfil (ver PerfilLojaAcesso).
   */
  private async userHasLojaAccess(userId: string, lojaId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.perfilId) return true;
    const acesso = await this.prisma.perfilLojaAcesso.findFirst({ where: { perfilId: user.perfilId, lojaId } });
    return !!acesso;
  }

  /**
   * Empresa inicial do SUPERADMIN "global" (o que não tem `clienteId` fixo).
   *
   * Antes ele reabria na última empresa que *alguém* tinha escolhido naquela
   * conta (`activeClienteId`) — o mesmo mecanismo que fazia duas pessoas se
   * empurrarem entre empresas. Agora começa sempre na empresa padrão, que é
   * determinístico e não vaza a escolha de outra sessão. Trocar de empresa
   * segue funcionando, valendo só para a sessão de quem trocou.
   *
   * Devolver uma empresa (em vez de null) também mantém o dashboard de pé:
   * SUPERADMIN sem empresa/loja não tem tela para renderizar.
   */
  private async clienteInicialDeSuperadmin(role: string): Promise<string | null> {
    if (role !== "SUPERADMIN") return null;
    const padrao = await this.prisma.cliente.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: "asc" },
    });
    if (padrao) return padrao.id;
    const primeira = await this.prisma.cliente.findFirst({ orderBy: { createdAt: "asc" } });
    return primeira?.id ?? null;
  }

  /**
   * Loja padrão da sessão: a primeira que o usuário pode ver. Sem
   * `activeLojaId`, toda sessão começa no mesmo lugar previsível, e trocar de
   * loja vale só para a sessão de quem trocou.
   */
  private async resolveEffectiveLoja(clienteId: string | null, perfilId: string | null): Promise<string | null> {
    if (!clienteId) return null;

    const where = perfilId ? { clienteId, perfilAcessos: { some: { perfilId } } } : { clienteId };
    const primeiraLoja = await this.prisma.loja.findFirst({ where, orderBy: { createdAt: "asc" } });
    return primeiraLoja?.id ?? null;
  }
}
