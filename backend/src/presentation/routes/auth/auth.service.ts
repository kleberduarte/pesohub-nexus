import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../infrastructure/database/prisma.service";

interface AuthenticatedUser {
  sub: string;
  email: string;
  role: string;
  clienteId: string | null;
  lojaId: string | null;
  scoped?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, senha: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    // SUPERADMIN "global" (clienteId nulo, vinculado ao domínio da empresa
    // padrão) não tem clienteId fixo — usa a última empresa selecionada via
    // "trocar de empresa" (persistida em activeClienteId), se houver, pra
    // manter a sessão na mesma empresa após logout/login. Já um SUPERADMIN
    // vinculado ao domínio de uma empresa específica (ex.: @ramuza.com.br)
    // tem clienteId fixo e fica travado nela, sem poder trocar de empresa.
    const scoped = user.role === "SUPERADMIN" && user.clienteId !== null;
    const effectiveClienteId = user.role === "SUPERADMIN" ? (user.clienteId ?? user.activeClienteId) : user.clienteId;
    const effectiveLojaId = await this.resolveEffectiveLoja(user.id, effectiveClienteId, user.activeLojaId, user.perfilId);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clienteId: effectiveClienteId,
      lojaId: effectiveLojaId,
      scoped,
    };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: "15m" }),
      user: payload,
    };
  }

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

    await this.prisma.user.update({
      where: { id: currentUser.sub },
      data: { activeClienteId: cliente.id, activeLojaId: null },
    });

    const effectiveLojaId = await this.resolveEffectiveLoja(currentUser.sub, cliente.id, null, null);

    const payload = {
      sub: currentUser.sub,
      email: currentUser.email,
      role: currentUser.role,
      clienteId: cliente.id,
      lojaId: effectiveLojaId,
      scoped: false,
    };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: "15m" }),
      user: payload,
    };
  }

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

    await this.prisma.user.update({ where: { id: currentUser.sub }, data: { activeLojaId: lojaId } });

    const payload = {
      sub: currentUser.sub,
      email: currentUser.email,
      role: currentUser.role,
      clienteId: currentUser.clienteId,
      lojaId,
      scoped: currentUser.scoped ?? false,
    };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: "15m" }),
      user: payload,
    };
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

  private async resolveEffectiveLoja(
    userId: string,
    clienteId: string | null,
    activeLojaId: string | null,
    perfilId: string | null,
  ): Promise<string | null> {
    if (!clienteId) return null;

    if (activeLojaId) {
      const loja = await this.prisma.loja.findFirst({ where: { id: activeLojaId, clienteId } });
      if (loja) return loja.id;
    }

    const where = perfilId
      ? { clienteId, perfilAcessos: { some: { perfilId } } }
      : { clienteId };
    const primeiraLoja = await this.prisma.loja.findFirst({ where, orderBy: { createdAt: "asc" } });
    return primeiraLoja?.id ?? null;
  }
}
