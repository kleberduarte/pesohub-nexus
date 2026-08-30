import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { AUTH_COOKIE_NAME } from "../routes/auth/auth-cookie";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { SKIP_BILLING_CHECK_KEY } from "./skip-billing-check.decorator";
import { SessionRevocationService } from "../../infrastructure/auth/session-revocation.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly sessions: SessionRevocationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException("Token ausente");
    }

    let user: { clienteId: string; role: string; scoped?: boolean; jti?: string };
    try {
      user = this.jwt.verify(token);
      request.user = user;
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado");
    }

    // Um token cuja sessão foi encerrada continua criptograficamente válido
    // até expirar — só a lista de revogação distingue os dois casos.
    if (await this.sessions.isRevoked(user.jti)) {
      throw new UnauthorizedException("Sessão encerrada. Faça login novamente.");
    }

    const skipBillingCheck = this.reflector.getAllAndOverride<boolean>(SKIP_BILLING_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // SUPERADMIN "global" (não vinculado a uma empresa por domínio) segue sem
    // checagem de billing; um SUPERADMIN travado numa empresa (scoped) é
    // tratado como usuário normal daquela empresa para fins de cobrança.
    if (skipBillingCheck || (user.role === "SUPERADMIN" && !user.scoped)) {
      return true;
    }

    const assinatura = await this.prisma.assinatura.findUnique({ where: { clienteId: user.clienteId } });
    if (assinatura && (assinatura.status === "INADIMPLENTE" || assinatura.status === "CANCELADA")) {
      throw new ForbiddenException("Assinatura inadimplente ou cancelada. Regularize o pagamento para continuar.");
    }

    return true;
  }
}
