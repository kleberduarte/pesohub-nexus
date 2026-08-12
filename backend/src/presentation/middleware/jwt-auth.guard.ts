import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { AUTH_COOKIE_NAME } from "../routes/auth/auth-cookie";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { SKIP_BILLING_CHECK_KEY } from "./skip-billing-check.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException("Token ausente");
    }

    let user: { clienteId: string; role: string };
    try {
      user = this.jwt.verify(token);
      request.user = user;
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado");
    }

    const skipBillingCheck = this.reflector.getAllAndOverride<boolean>(SKIP_BILLING_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipBillingCheck || user.role === "SUPERADMIN") {
      return true;
    }

    const assinatura = await this.prisma.assinatura.findUnique({ where: { clienteId: user.clienteId } });
    if (assinatura && (assinatura.status === "INADIMPLENTE" || assinatura.status === "CANCELADA")) {
      throw new ForbiddenException("Assinatura inadimplente ou cancelada. Regularize o pagamento para continuar.");
    }

    return true;
  }
}
