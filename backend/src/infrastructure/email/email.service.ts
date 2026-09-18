import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConteudoEmail, montarEmail } from "./email-layout";

export interface EnviarEmailInput {
  para: string;
  assunto: string;
  conteudo: ConteudoEmail;
}

/**
 * Envio de e-mail transacional via Resend (card #89). Pré-requisito da
 * recuperação de senha (#90), do convite de usuário (#91) e do aviso de
 * cobrança (#6).
 *
 * Sem RESEND_API_KEY o backend sobe normalmente — nenhum fluxo existente
 * depende de e-mail. Só o envio falha, e falha alto: exceção para quem
 * chamou e erro no log. E-mail que não sai nunca some em silêncio.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly remetente: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>("RESEND_API_KEY") ?? "";
    this.remetente = this.config.get<string>("EMAIL_FROM") ?? "PesoHub <nao-responda@pesohub.com.br>";
    this.baseUrl = this.config.get<string>("RESEND_BASE_URL") ?? "https://api.resend.com";
    if (!this.apiKey) {
      this.logger.warn("RESEND_API_KEY não configurada: o envio de e-mail está desativado.");
    }
  }

  get configurado(): boolean {
    return Boolean(this.apiKey);
  }

  async enviar({ para, assunto, conteudo }: EnviarEmailInput): Promise<{ id: string }> {
    const destino = mascararEmail(para);
    if (!this.apiKey) {
      this.logger.error(`E-mail "${assunto}" para ${destino} não enviado: RESEND_API_KEY não configurada.`);
      throw new ServiceUnavailableException("Envio de e-mail não configurado.");
    }

    const { html, text } = montarEmail(conteudo);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/emails`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: this.remetente, to: [para], subject: assunto, html, text }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      this.logger.error(`E-mail "${assunto}" para ${destino} não enviado: ${(err as Error).message}`);
      throw new ServiceUnavailableException("Não foi possível enviar o e-mail agora.");
    }

    if (!res.ok) {
      // O corpo de erro do Resend descreve o problema (domínio não verificado,
      // chave inválida) e não contém segredo — vai para o log, não para o usuário.
      const corpo = (await res.text()).slice(0, 500);
      this.logger.error(`E-mail "${assunto}" para ${destino} recusado pelo Resend (${res.status}): ${corpo}`);
      throw new ServiceUnavailableException("Não foi possível enviar o e-mail agora.");
    }

    const { id } = (await res.json()) as { id: string };
    this.logger.log(`E-mail "${assunto}" enviado para ${destino} (id ${id})`);
    return { id };
  }
}

/** "fulano@empresa.com" -> "fu***@empresa.com". Endereço completo não vai para o log. */
export function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split("@");
  if (!dominio) return "***";
  return `${usuario.slice(0, 2)}***@${dominio}`;
}
