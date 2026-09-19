import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { EmailService } from "../../../infrastructure/email/email.service";
import { resolverUrlFrontend } from "../../../infrastructure/email/url-frontend";
import { gerarTokenSenha, VALIDADE_CONVITE_DIAS } from "../../../domain/services/token-senha";

/**
 * Convite de usuário por e-mail (card #91): a conta nasce sem senha conhecida
 * e o convidado escolhe a própria. Ninguém além dele chega a saber a senha —
 * nem quem criou a conta, nem o WhatsApp por onde ela antes trafegava.
 */
@Injectable()
export class ConviteService {
  private readonly urlFrontend: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    config: ConfigService,
  ) {
    this.urlFrontend = resolverUrlFrontend(config);
  }

  /**
   * Gera um convite novo (invalidando os anteriores) e envia o e-mail.
   *
   * Aguarda o envio de propósito — ao contrário do "esqueci minha senha", aqui
   * quem chama é o administrador logado, e ele precisa saber se o e-mail não
   * saiu para reenviar. Devolve false em vez de lançar: a conta já foi criada
   * e não deve desaparecer porque o provedor de e-mail falhou.
   */
  async enviar(user: { id: string; email: string }, empresa: string | null): Promise<boolean> {
    const { token, tokenHash } = gerarTokenSenha();
    const agora = new Date();
    await this.prisma.$transaction([
      this.prisma.tokenSenha.updateMany({
        where: { userId: user.id, tipo: "CONVITE", usadoEm: null },
        data: { usadoEm: agora },
      }),
      this.prisma.tokenSenha.create({
        data: {
          userId: user.id,
          tipo: "CONVITE",
          tokenHash,
          expiraEm: new Date(agora.getTime() + VALIDADE_CONVITE_DIAS * 24 * 60 * 60_000),
        },
      }),
    ]);

    const url = `${this.urlFrontend}/aceitar-convite?token=${encodeURIComponent(token)}`;
    try {
      await this.email.enviar({
        para: user.email,
        assunto: "Seu acesso ao PesoHub",
        conteudo: {
          titulo: "Você foi convidado para o PesoHub",
          paragrafos: [
            empresa
              ? `Uma conta foi criada para você no PesoHub da empresa ${empresa}.`
              : "Uma conta foi criada para você no PesoHub.",
            `Para entrar, defina sua senha pelo botão abaixo. Seu login é ${user.email}.`,
          ],
          acao: { rotulo: "Definir minha senha", url },
          observacao: `O convite vale por ${VALIDADE_CONVITE_DIAS} dias e só pode ser usado uma vez. Se você não esperava este e-mail, pode ignorá-lo.`,
        },
      });
      return true;
    } catch {
      // O EmailService já registrou o motivo no log.
      return false;
    }
  }

  /** Invalida o convite pendente: o link para de funcionar na hora. */
  async cancelar(userId: string): Promise<number> {
    const { count } = await this.prisma.tokenSenha.updateMany({
      where: { userId, tipo: "CONVITE", usadoEm: null },
      data: { usadoEm: new Date() },
    });
    return count;
  }
}
