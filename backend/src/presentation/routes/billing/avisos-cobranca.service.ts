import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { EmailService } from "../../../infrastructure/email/email.service";
import { resolverUrlFrontend } from "../../../infrastructure/email/url-frontend";
import { DIAS_DE_CARENCIA, limiteDeCarencia } from "../../../domain/services/precificacao";

/** Quantos dias antes do vencimento sai o segundo aviso. */
export const DIAS_AVISO_PRE_VENCIMENTO = 3;
/** Intervalo da rodada automática. Os avisos são diários por natureza. */
const INTERVALO_RODADA_MS = 24 * 60 * 60 * 1000;
/** Espera depois do boot antes da primeira rodada, para não brigar com a subida. */
const ATRASO_PRIMEIRA_RODADA_MS = 5 * 60 * 1000;

export type TipoAviso = "GERADA" | "PRE_VENCIMENTO" | "VENCIDA";

/** Coluna que marca cada aviso como já enviado. */
const COLUNA_DO_AVISO: Record<TipoAviso, "avisoGeradaEm" | "avisoPreVencimento" | "avisoVencidaEm"> = {
  GERADA: "avisoGeradaEm",
  PRE_VENCIMENTO: "avisoPreVencimento",
  VENCIDA: "avisoVencidaEm",
};

export interface ResumoRodada {
  enviados: number;
  porTipo: Record<TipoAviso, number>;
  semDestinatario: number;
  falhas: number;
}

/**
 * Vencimento é data de CALENDÁRIO, não instante: o Asaas manda "2026-09-10" e
 * isso vira meia-noite UTC. Formatar em horário de Brasília (UTC-3) joga para
 * 21h do dia ANTERIOR, e o e-mail passa a anunciar um vencimento um dia mais
 * cedo do que o real. Por isso a formatação é em UTC.
 */
const dataBr = (data: Date) => data.toLocaleDateString("pt-BR", { timeZone: "UTC" });

/**
 * Avisos de cobrança por e-mail (card #100).
 *
 * São três por fatura — gerada, três dias antes do vencimento e no vencimento —
 * e cada um sai UMA vez: a coluna correspondente em `Fatura` é a marca. O
 * texto sempre diz que a balança continua pesando e imprimindo, porque o medo
 * de parar a operação é o que gera ligação para o suporte (mesma linguagem da
 * tela de Assinatura, card #99).
 */
@Injectable()
export class AvisosCobrancaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AvisosCobrancaService.name);
  private temporizadores: NodeJS.Timeout[] = [];
  private rodando = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    // Sem chave do Resend não há o que agendar: a rodada só produziria erro
    // de minuto em minuto. O endpoint manual segue existindo e falha alto.
    if (!this.email.configurado) {
      this.logger.warn("Avisos de cobrança desativados: RESEND_API_KEY não configurada.");
      return;
    }
    const primeira = setTimeout(() => {
      void this.rodarComLog();
      const diaria = setInterval(() => void this.rodarComLog(), INTERVALO_RODADA_MS);
      diaria.unref?.();
      this.temporizadores.push(diaria);
    }, ATRASO_PRIMEIRA_RODADA_MS);
    primeira.unref?.();
    this.temporizadores.push(primeira);
  }

  onModuleDestroy() {
    for (const t of this.temporizadores) clearTimeout(t);
    this.temporizadores = [];
  }

  private async rodarComLog() {
    try {
      const resumo = await this.rodar();
      if (resumo.enviados || resumo.falhas || resumo.semDestinatario) {
        this.logger.log(
          `Avisos de cobrança: ${resumo.enviados} enviado(s), ${resumo.falhas} falha(s), ` +
            `${resumo.semDestinatario} sem destinatário.`,
        );
      }
    } catch (err) {
      this.logger.error(`Rodada de avisos de cobrança falhou: ${(err as Error).message}`);
    }
  }

  /**
   * Uma rodada completa. É idempotente: o que já foi avisado fica marcado, e a
   * marca é feita ANTES do envio, por update condicional — duas instâncias do
   * backend rodando ao mesmo tempo não mandam o mesmo aviso duas vezes. Se o
   * envio falha, a marca é desfeita e a próxima rodada tenta de novo.
   */
  async rodar(agora = new Date()): Promise<ResumoRodada> {
    // Uma rodada por vez dentro do processo: a manual pode cair em cima da
    // automática, e duas varreduras simultâneas só duplicariam trabalho.
    if (this.rodando) {
      this.logger.warn("Rodada de avisos ignorada: outra já está em andamento.");
      return { enviados: 0, porTipo: { GERADA: 0, PRE_VENCIMENTO: 0, VENCIDA: 0 }, semDestinatario: 0, falhas: 0 };
    }
    this.rodando = true;
    const resumo: ResumoRodada = {
      enviados: 0,
      porTipo: { GERADA: 0, PRE_VENCIMENTO: 0, VENCIDA: 0 },
      semDestinatario: 0,
      falhas: 0,
    };

    try {
      for (const tipo of ["GERADA", "PRE_VENCIMENTO", "VENCIDA"] as TipoAviso[]) {
        for (const fatura of await this.faturasPendentesDe(tipo, agora)) {
          const destinatarios = await this.destinatarios(fatura.assinatura.clienteId, fatura.assinatura.dominioRede);
          if (destinatarios.length === 0) {
            resumo.semDestinatario += 1;
            this.logger.warn(
              `Fatura ${fatura.id} (@${fatura.assinatura.dominioRede ?? "sem rede"}) sem ninguém para avisar: ` +
                "a rede não tem Administrador da loja cadastrado.",
            );
            continue;
          }

          // Marca primeiro, envia depois: a condição "ainda não avisado" no
          // próprio UPDATE é o que garante um aviso só.
          const reservou = await this.prisma.fatura.updateMany({
            where: { id: fatura.id, [COLUNA_DO_AVISO[tipo]]: null },
            data: { [COLUNA_DO_AVISO[tipo]]: agora },
          });
          if (reservou.count === 0) continue;

          try {
            await this.enviarAviso(tipo, fatura, destinatarios);
            resumo.enviados += 1;
            resumo.porTipo[tipo] += 1;
          } catch (err) {
            // Desmarca para a próxima rodada tentar. Uma falha de envio não
            // pode consumir o único aviso daquela fatura.
            await this.prisma.fatura.update({
              where: { id: fatura.id },
              data: { [COLUNA_DO_AVISO[tipo]]: null },
            });
            resumo.falhas += 1;
            this.logger.error(`Aviso ${tipo} da fatura ${fatura.id} não enviado: ${(err as Error).message}`);
          }
        }
      }
    } finally {
      this.rodando = false;
    }

    return resumo;
  }

  /** Faturas que ainda devem receber este aviso. */
  private async faturasPendentesDe(tipo: TipoAviso, agora: Date) {
    const naoAvisada = { [COLUNA_DO_AVISO[tipo]]: null };
    const emAberto = { status: { in: ["PENDENTE", "VENCIDA"] as const } };

    if (tipo === "GERADA") {
      return this.buscar({ ...emAberto, ...naoAvisada });
    }

    if (tipo === "PRE_VENCIMENTO") {
      const limite = new Date(agora.getTime() + DIAS_AVISO_PRE_VENCIMENTO * 24 * 60 * 60 * 1000);
      // Só o que vence DENTRO da janela e ainda não venceu: depois do
      // vencimento quem fala é o aviso de vencida, não este.
      return this.buscar({ ...emAberto, ...naoAvisada, dataVencimento: { gt: agora, lte: limite } });
    }

    return this.buscar({ ...emAberto, ...naoAvisada, dataVencimento: { lte: agora } });
  }

  private buscar(where: object) {
    return this.prisma.fatura.findMany({
      where,
      include: { assinatura: true },
      orderBy: { dataVencimento: "asc" },
      // Teto por rodada: um susto no banco (ou uma carga inicial) não vira
      // centenas de e-mails de uma vez.
      take: 200,
    });
  }

  /**
   * Quem recebe: o Administrador da loja daquela rede. É o papel que a tela de
   * Assinatura atende (#99) e o único que pode resolver o pagamento.
   */
  private async destinatarios(clienteId: string, dominioRede: string | null): Promise<string[]> {
    if (!dominioRede) return [];
    const usuarios = await this.prisma.user.findMany({
      where: {
        clienteId,
        role: "ADMIN_REDE",
        email: { endsWith: `@${dominioRede}`, mode: "insensitive" },
      },
      select: { email: true },
    });
    return usuarios.map((u) => u.email);
  }

  private async enviarAviso(
    tipo: TipoAviso,
    fatura: {
      valor: unknown;
      dataVencimento: Date | null;
      linkPagamento: string | null;
      assinatura: { dominioRede: string | null };
    },
    destinatarios: string[],
  ) {
    const valor = Number(fatura.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const vencimento = fatura.dataVencimento ? dataBr(fatura.dataVencimento) : null;
    const rede = fatura.assinatura.dominioRede ?? "";
    const urlAssinatura = `${resolverUrlFrontend(this.config)}/assinatura`;

    // A frase que evita a ligação para o suporte. Vai nos três avisos.
    const balancaSegueFuncionando =
      "As balanças continuam pesando e imprimindo etiquetas normalmente, com os produtos já sincronizados.";

    // O aviso de vencida precisa dizer QUANDO trava — é a informação que o
    // gerente usa para se organizar. Mesma carência que o guard aplica.
    const bloqueio = limiteDeCarencia(fatura.dataVencimento);
    const { assunto, titulo, paragrafos } = this.textoDo(tipo, {
      valor,
      vencimento,
      rede,
      balancaSegueFuncionando,
      bloqueiaEm: bloqueio ? dataBr(bloqueio) : null,
    });

    for (const para of destinatarios) {
      await this.email.enviar({
        para,
        assunto,
        conteudo: {
          titulo,
          paragrafos,
          acao: { rotulo: "Ver a fatura", url: fatura.linkPagamento || urlAssinatura },
          observacao: fatura.linkPagamento
            ? "O pagamento é processado pelo Asaas, nosso provedor de cobrança."
            : undefined,
        },
      });
    }
  }

  private textoDo(
    tipo: TipoAviso,
    dados: {
      valor: string;
      vencimento: string | null;
      rede: string;
      balancaSegueFuncionando: string;
      bloqueiaEm: string | null;
    },
  ): { assunto: string; titulo: string; paragrafos: string[] } {
    const { valor, vencimento, rede, balancaSegueFuncionando, bloqueiaEm } = dados;

    if (tipo === "GERADA") {
      return {
        assunto: `Fatura do PesoHub — ${valor}`,
        titulo: "Sua fatura está disponível",
        paragrafos: [
          `A mensalidade do PesoHub da rede ${rede} é de ${valor}` +
            (vencimento ? `, com vencimento em ${vencimento}.` : "."),
          "O valor acompanha as balanças cadastradas; a tela de Assinatura mostra a conta aberta.",
        ],
      };
    }

    if (tipo === "PRE_VENCIMENTO") {
      return {
        assunto: `Sua fatura do PesoHub vence ${vencimento ? `em ${vencimento}` : "em breve"}`,
        titulo: "Sua fatura vence em breve",
        paragrafos: [
          `A fatura de ${valor} da rede ${rede}` +
            (vencimento ? ` vence em ${vencimento}.` : " vence nos próximos dias."),
          "Se o pagamento já foi feito, pode ignorar este aviso.",
        ],
      };
    }

    return {
      assunto: `Fatura do PesoHub vencida — ${valor}`,
      titulo: "Sua fatura venceu",
      paragrafos: [
        `A fatura de ${valor} da rede ${rede}` + (vencimento ? ` venceu em ${vencimento}.` : " está vencida."),
        balancaSegueFuncionando,
        bloqueiaEm
          ? `A partir de ${bloqueiaEm}, o cadastro de produtos e a sincronização com as balanças ficam bloqueados ` +
            `até a regularização — são ${DIAS_DE_CARENCIA} dias de tolerância após o vencimento.`
          : `Passados ${DIAS_DE_CARENCIA} dias do vencimento, o cadastro de produtos e a sincronização com as ` +
            "balanças ficam bloqueados até a regularização.",
      ],
    };
  }
}
