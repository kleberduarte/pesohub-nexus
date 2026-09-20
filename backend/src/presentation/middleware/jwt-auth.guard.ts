import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { AUTH_COOKIE_NAME } from "../routes/auth/auth-cookie";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { SKIP_BILLING_CHECK_KEY } from "./skip-billing-check.decorator";
import { IS_PUBLIC_KEY } from "./public.decorator";
import {
  MENSAGEM_POR_MOTIVO,
  SessionRevocationService,
} from "../../infrastructure/auth/session-revocation.service";
import { SessionScopeService } from "../../infrastructure/auth/session-scope.service";
import { DIAS_DE_CARENCIA, bloqueiaPorAtraso } from "../../domain/services/precificacao";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly sessions: SessionRevocationService,
    private readonly scope: SessionScopeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // O guard é global, então ele roda inclusive nas poucas rotas que precisam
    // ser públicas. `@Public()` é a única saída, e ela é explícita por design.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException("Token ausente");
    }

    let user: {
      sub: string;
      clienteId: string;
      lojaId: string | null;
      role: string;
      perfilId?: string | null;
      scoped?: boolean;
      jti?: string;
    };
    try {
      user = this.jwt.verify(token);
      request.user = user;
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado");
    }

    // Um token cuja sessão foi encerrada continua criptograficamente válido
    // até expirar — só a lista de revogação distingue os dois casos. O motivo
    // vira a mensagem: quem foi derrubado por um login em outro dispositivo
    // precisa saber disso, é o sinal de que alguém está usando a conta dele.
    const motivo = await this.sessions.motivoRevogacao(user.jti);
    if (motivo) {
      throw new UnauthorizedException(MENSAGEM_POR_MOTIVO[motivo]);
    }

    // Timeout por inatividade: o JWT ainda vale, mas a sessão ficou parada
    // além da janela. Renovar aqui é o que faz a sessão durar enquanto a
    // pessoa está trabalhando.
    if (await this.sessions.expirouPorInatividade(user.jti)) {
      await this.sessions.revoke(user.jti, (user as { exp?: number }).exp, "inatividade");
      throw new UnauthorizedException(MENSAGEM_POR_MOTIVO.inatividade);
    }
    await this.sessions.marcarAtividade(user.jti);

    // Escopo por aba: o token traz a empresa/loja padrão da sessão, mas cada
    // aba pode estar numa loja diferente. O cabeçalho vem do navegador, então
    // é revalidado contra o banco aqui — ele só escolhe entre o que a conta já
    // pode ver, nunca amplia permissão.
    const escopo = await this.scope.resolver(user as never, request.headers ?? {});
    request.user = { ...user, ...escopo };
    user = request.user;

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

    // Card #97: a cobrança é da REDE (supermercado), não da empresa. O
    // contrato da fabricante fica de fora de propósito — bloquear a empresa
    // derrubaria junto todos os supermercados que dependem dela.
    //
    // A rede sai da LOJA ativa da sessão, não do texto do e-mail: quem tem o
    // e-mail é o usuário, e trocar o domínio de um usuário (ou limpar o da
    // loja) apagaria o bloqueio de uma rede inadimplente inteira.
    const loja = user.lojaId
      ? await this.prisma.loja.findUnique({ where: { id: user.lojaId }, select: { dominioEmail: true } })
      : null;
    const dominio = loja?.dominioEmail?.toLowerCase() ?? null;
    const assinatura = dominio
      ? await this.prisma.assinatura.findUnique({
          where: { clienteId_dominioRede: { clienteId: user.clienteId, dominioRede: dominio } },
        })
      : null;
    if (!assinatura) return true;

    const emAtraso = assinatura.status === "INADIMPLENTE" || assinatura.status === "CANCELADA";
    if (!emAtraso) return true;

    // Leitura continua liberada, e as balanças seguem pesando com o que já foi
    // sincronizado: o que trava é mudar dados e mandar para o equipamento.
    const metodo = (request.method ?? "GET").toUpperCase();
    const somenteLeitura = metodo === "GET" || metodo === "HEAD" || metodo === "OPTIONS";
    const bloqueado =
      assinatura.status === "CANCELADA" ||
      bloqueiaPorAtraso(assinatura.proximoVencimento, DIAS_DE_CARENCIA, new Date());
    if (bloqueado && !somenteLeitura) {
      throw new ForbiddenException(
        "Assinatura em atraso. Regularize o pagamento para voltar a cadastrar e sincronizar.",
      );
    }

    return true;
  }
}
