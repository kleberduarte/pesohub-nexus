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

    const payload = { sub: user.id, email: user.email, role: user.role, clienteId: user.clienteId };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: "15m" }),
      refreshToken: this.jwt.sign(payload, { expiresIn: "7d" }),
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

    const payload = { sub: currentUser.sub, email: currentUser.email, role: currentUser.role, clienteId: cliente.id };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: "15m" }),
      refreshToken: this.jwt.sign(payload, { expiresIn: "7d" }),
    };
  }
}
