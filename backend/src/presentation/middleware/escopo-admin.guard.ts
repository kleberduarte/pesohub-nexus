import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { PrismaService } from "../../infrastructure/database/prisma.service";

export const EMPRESA_INTEIRA_KEY = "exige_empresa_inteira";

/**
 * Marca uma rota como exclusiva de quem administra a EMPRESA INTEIRA, não uma
 * loja (card #85).
 *
 * Desde o card #83, "ADMIN de loja" é um ADMIN com Perfil de uma loja só. O
 * plano de DADOS (produtos, balanças, etiquetas) já é filtrado pela loja do
 * request, mas o plano ADMINISTRATIVO — criar loja, mexer em perfis, assinar —
 * é da empresa por natureza. Sem esta marca, um gerente de loja abriria lojas
 * novas e mudaria a cobrança de toda a rede.
 *
 * A regra é simples de propósito: ter Perfil = ter escopo = não administra a
 * empresa inteira. Perfil nulo segue significando "todas as lojas".
 */
export const ExigeEmpresaInteira = () => SetMetadata(EMPRESA_INTEIRA_KEY, true);

@Injectable()
export class EscopoAdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const exige = this.reflector.getAllAndOverride<boolean>(EMPRESA_INTEIRA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!exige) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: { sub?: string; role?: string } }>();
    const sub = req.user?.sub;
    if (!sub) throw new ForbiddenException("Sessão inválida");

    // O escopo vem do BANCO, nunca do token: um token emitido antes de a
    // pessoa ser restringida a uma loja continuaria valendo até expirar.
    const usuario = await this.prisma.user.findUnique({ where: { id: sub }, select: { perfilId: true } });
    if (usuario?.perfilId) {
      throw new ForbiddenException(
        "Esta ação é de quem administra a empresa inteira. Seu acesso está restrito às lojas do seu perfil.",
      );
    }
    return true;
  }
}
