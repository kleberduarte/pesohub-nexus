import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../infrastructure/database/prisma.service";

interface AuthenticatedUser {
  sub: string;
  email: string;
  role: string;
  clienteId: string | null;
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

    // SUPERADMIN não tem clienteId fixo — usa a última empresa selecionada
    // via "trocar de empresa" (persistida em activeClienteId), se houver,
    // pra manter a sessão na mesma empresa após logout/login.
    const effectiveClienteId = user.role === "SUPERADMIN" ? user.activeClienteId : user.clienteId;

    const payload = { sub: user.id, email: user.email, role: user.role, clienteId: effectiveClienteId };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: "15m" }),
      user: payload,
    };
  }

  async switchCompany(currentUser: AuthenticatedUser, clienteId: string) {
    if (currentUser.role !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode trocar de empresa");
    }

    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      throw new NotFoundException("Empresa não encontrada");
    }

    await this.prisma.user.update({
      where: { id: currentUser.sub },
      data: { activeClienteId: cliente.id },
    });

    const payload = { sub: currentUser.sub, email: currentUser.email, role: currentUser.role, clienteId: cliente.id };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: "15m" }),
      user: payload,
    };
  }
}
