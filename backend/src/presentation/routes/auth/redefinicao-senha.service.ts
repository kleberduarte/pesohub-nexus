import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { EmailService } from "../../../infrastructure/email/email.service";
import { SessionRevocationService } from "../../../infrastructure/auth/session-revocation.service";
import {
  acrescentarAoHistorico,
  reusaSenhaAnterior,
  validarComplexidade,
} from "../../../domain/services/password-policy";
import { gerarTokenSenha, hashTokenSenha, VALIDADE_REDEFINICAO_MINUTOS } from "../../../domain/services/token-senha";

const LINK_INVALIDO = "Este link é inválido ou já expirou. Peça um novo em \"Esqueci minha senha\".";

/**
 * "Esqueci minha senha" (card #90): a pessoa recupera o acesso sozinha, sem
 * ninguém da equipe mexer no banco ou repassar senha por WhatsApp.
 */
@Injectable()
export class RedefinicaoSenhaService {
  private readonly logger = new Logger(RedefinicaoSenhaService.name);
  private readonly urlFrontend: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly sessions: SessionRevocationService,
    config: ConfigService,
  ) {
    // FRONTEND_URL é o endereço que vai no link. Sem ela, o primeiro
    // CORS_ORIGIN — que em produção já é o endereço do frontend.
    const cors = (config.get<string>("CORS_ORIGIN") ?? "").split(",")[0]?.trim();
    this.urlFrontend = (config.get<string>("FRONTEND_URL") || cors || "http://localhost:3001").replace(/\/+$/, "");
  }

  /**
   * Não revela se o e-mail existe: quem chama recebe sempre a mesma resposta,
   * no mesmo tempo. Por isso o envio não é aguardado — esperar o Resend só
   * quando o usuário existe faria o tempo de resposta denunciar a conta.
   */
  async solicitar(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
    if (!user) return;

    const { token, tokenHash } = gerarTokenSenha();
    const agora = new Date();
    await this.prisma.$transaction([
      // Um link novo invalida os anteriores: só o mais recente vale.
      this.prisma.tokenSenha.updateMany({
        where: { userId: user.id, tipo: "REDEFINICAO", usadoEm: null },
        data: { usadoEm: agora },
      }),
      this.prisma.tokenSenha.create({
        data: {
          userId: user.id,
          tipo: "REDEFINICAO",
          tokenHash,
          expiraEm: new Date(agora.getTime() + VALIDADE_REDEFINICAO_MINUTOS * 60_000),
        },
      }),
    ]);

    const url = `${this.urlFrontend}/redefinir-senha?token=${encodeURIComponent(token)}`;
    void this.email
      .enviar({
        para: user.email,
        assunto: "Redefinição de senha do PesoHub",
        conteudo: {
          titulo: "Redefinir sua senha",
          paragrafos: [
            "Recebemos um pedido para redefinir a senha da sua conta no PesoHub.",
            "Clique no botão abaixo para escolher uma nova senha.",
          ],
          acao: { rotulo: "Redefinir senha", url },
          observacao: `O link vale por ${VALIDADE_REDEFINICAO_MINUTOS} minutos e só pode ser usado uma vez. Se você não pediu a redefinição, ignore este e-mail: sua senha continua a mesma.`,
        },
      })
      // O EmailService já registrou o erro; aqui só impede rejeição não tratada.
      .catch(() => undefined);
  }

  /** Aplica a nova senha. Devolve o usuário para a trilha de auditoria. */
  async redefinir(token: string, novaSenha: string): Promise<{ id: string; email: string }> {
    const registro = await this.prisma.tokenSenha.findUnique({
      where: { tokenHash: hashTokenSenha(token) },
      include: { user: true },
    });
    if (!registro || registro.tipo !== "REDEFINICAO" || registro.usadoEm || registro.expiraEm <= new Date()) {
      throw new BadRequestException(LINK_INVALIDO);
    }
    const user = registro.user;

    const problemas = validarComplexidade(novaSenha, user.email);
    if (problemas.length > 0) {
      throw new BadRequestException(problemas.join(" "));
    }
    if (await bcrypt.compare(novaSenha, user.senha)) {
      throw new BadRequestException("A nova senha precisa ser diferente da atual.");
    }
    if (await reusaSenhaAnterior(novaSenha, user.senhasAnteriores)) {
      throw new BadRequestException("Esta senha já foi usada antes. Escolha uma que você ainda não usou.");
    }

    const hash = await bcrypt.hash(novaSenha, 10);
    await this.prisma.$transaction(async (tx) => {
      // Queima condicional: de dois cliques simultâneos no mesmo link, só um
      // encontra usadoEm nulo. O outro não redefine nada.
      const queimado = await tx.tokenSenha.updateMany({
        where: { id: registro.id, usadoEm: null },
        data: { usadoEm: new Date() },
      });
      if (queimado.count === 0) throw new BadRequestException(LINK_INVALIDO);

      await tx.user.update({
        where: { id: user.id },
        data: {
          senha: hash,
          senhasAnteriores: acrescentarAoHistorico(user.senhasAnteriores, user.senha),
          // Quem definiu pelo link escolheu a senha sozinho: não há por que
          // forçar outra troca no próximo login.
          mustChangePassword: false,
          passwordChangedAt: new Date(),
          // Redefinir é justamente a saída de quem se trancou errando a senha.
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    });

    // Se o motivo do reset foi senha vazada, a sessão aberta com ela cai aqui.
    await this.sessions.encerrarSessaoAtiva(user.id, "senha_redefinida");
    this.logger.log(`Senha redefinida por link para o usuário ${user.id}`);
    return { id: user.id, email: user.email };
  }
}
