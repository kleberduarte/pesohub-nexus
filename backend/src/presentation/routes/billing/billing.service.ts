import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { AsaasService } from "../../../infrastructure/billing/asaas.service";
import { CreateAssinaturaDto } from "../../../application/dtos/create-assinatura.dto";
import { DIAS_DE_CARENCIA, calcularCobranca, limiteDeCarencia } from "../../../domain/services/precificacao";
import { situacaoDaAssinatura } from "./painel.service";
import { normalizarDominio } from "../../../domain/services/acesso-por-dominio";

const ASAAS_BILLING_TYPE: Record<CreateAssinaturaDto["formaPagamento"], "PIX" | "BOLETO" | "CREDIT_CARD"> = {
  PIX: "PIX",
  BOLETO: "BOLETO",
  CARTAO_CREDITO: "CREDIT_CARD",
};

/**
 * Status do Asaas -> status da fatura. É o status ATUAL da cobrança, buscado
 * na API, e não o evento que chegou: evento fora de ordem não pode derrubar
 * quem já pagou (card #97).
 */
const ASAAS_STATUS_TO_FATURA: Record<string, "PENDENTE" | "CONFIRMADA" | "RECEBIDA" | "VENCIDA" | "CANCELADA"> = {
  PENDING: "PENDENTE",
  AWAITING_RISK_ANALYSIS: "PENDENTE",
  CONFIRMED: "CONFIRMADA",
  RECEIVED: "RECEBIDA",
  RECEIVED_IN_CASH: "RECEBIDA",
  OVERDUE: "VENCIDA",
  DELETED: "CANCELADA",
  REFUNDED: "CANCELADA",
  CHARGEBACK_REQUESTED: "VENCIDA",
};

/** Preço padrão por balança, em reais (card #97). */
export const VALOR_POR_BALANCA = 40;
/** Mínimo de balanças de uma rede de supermercado. */
export const MINIMO_BALANCAS_REDE = 1;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaas: AsaasService,
  ) {}

  /**
   * Rede (supermercado) de quem está agindo. Sai do domínio do e-mail do
   * usuário, confirmado contra as lojas — nunca do que a tela mandar.
   * Quem administra a empresa pode indicar a rede explicitamente.
   */
  async resolverRede(
    usuario: { sub: string; role: string; clienteId: string | null },
    dominioPedido?: string | null,
  ): Promise<string | null> {
    const clienteId = usuario.clienteId;
    if (!clienteId) throw new ForbiddenException("Nenhuma empresa ativa");

    const eu = await this.prisma.user.findUnique({ where: { id: usuario.sub }, select: { email: true } });
    const meuDominio = normalizarDominio(eu?.email.split("@")[1]);
    const minhaRede = meuDominio
      ? await this.prisma.loja.findFirst({ where: { clienteId, dominioEmail: meuDominio }, select: { id: true } })
      : null;

    // Funcionário de supermercado só mexe na assinatura da própria rede.
    if (minhaRede) {
      const pedido = normalizarDominio(dominioPedido);
      if (pedido && pedido !== meuDominio) {
        throw new ForbiddenException("Você só pode ver a assinatura da sua própria rede");
      }
      return meuDominio;
    }

    if (usuario.role !== "ADMIN" && usuario.role !== "SUPERADMIN") {
      throw new ForbiddenException("Sem permissão para gerenciar assinaturas");
    }
    return normalizarDominio(dominioPedido);
  }

  /** Balanças cadastradas na rede — a base do preço. */
  async contarBalancasDaRede(clienteId: string, dominioRede: string | null): Promise<number> {
    return this.prisma.device.count({
      where: dominioRede ? { clienteId, loja: { dominioEmail: dominioRede } } : { clienteId },
    });
  }

  /**
   * Toda rede nasce com uma assinatura em "aguardando ativação", já com o
   * valor calculado (card #99). Antes, quem nunca abrisse a tela ficava sem
   * cobrança nenhuma — e o gerente encarava um formulário em branco, sem saber
   * o preço. Não fala com o Asaas: só existe quando ele escolhe como pagar.
   */
  async garantirAssinaturaPendente(clienteId: string, dominioRedeBruto: string | null | undefined) {
    const dominioRede = normalizarDominio(dominioRedeBruto);
    if (!dominioRede) return null;

    const existente = await this.prisma.assinatura.findUnique({
      where: { clienteId_dominioRede: { clienteId, dominioRede } },
    });
    if (existente) return existente;

    const quantidade = await this.contarBalancasDaRede(clienteId, dominioRede);
    const cobranca = calcularCobranca(quantidade, VALOR_POR_BALANCA, MINIMO_BALANCAS_REDE);
    try {
      return await this.prisma.assinatura.create({
        data: {
          clienteId,
          dominioRede,
          asaasCustomerId: "",
          status: "TRIAL",
          // Só vira escolha de verdade na ativação; aqui é o padrão do produto.
          formaPagamento: "PIX",
          valorUnitario: VALOR_POR_BALANCA,
          quantidadeMinima: MINIMO_BALANCAS_REDE,
          quantidadeBalancas: cobranca.quantidadeApurada,
          valor: cobranca.valorTotal,
        },
      });
    } catch {
      // Corrida com outra criação da mesma rede: a que já existe vale.
      return this.prisma.assinatura.findUnique({
        where: { clienteId_dominioRede: { clienteId, dominioRede } },
      });
    }
  }

  async subscribe(clienteId: string, dominioRede: string | null, dto: CreateAssinaturaDto) {
    if (!dominioRede) {
      throw new BadRequestException(
        "Informe a rede (domínio de e-mail da loja) que vai assinar. O contrato da fabricante é gerido em Contrato de licenciamento.",
      );
    }
    const lojas = await this.prisma.loja.count({ where: { clienteId, dominioEmail: dominioRede } });
    if (lojas === 0) {
      throw new NotFoundException(`Nenhuma loja com o domínio @${dominioRede}.`);
    }

    const cliente = await this.prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
    const quantidade = await this.contarBalancasDaRede(clienteId, dominioRede);
    // O valor NUNCA vem da tela: sai da contagem de balanças e do preço acordado.
    const cobranca = calcularCobranca(quantidade, VALOR_POR_BALANCA, MINIMO_BALANCAS_REDE);

    // A vaga é reservada no banco ANTES de falar com o Asaas. Sem isso, dois
    // pedidos simultâneos passavam os dois pela checagem e criavam DUAS
    // assinaturas no Asaas — a segunda invisível ao sistema, cobrando o
    // cliente todo mês sem como cancelar pela tela.
    const reserva = {
      asaasCustomerId: "",
      status: "TRIAL" as const,
      formaPagamento: dto.formaPagamento,
      valorUnitario: VALOR_POR_BALANCA,
      quantidadeMinima: MINIMO_BALANCAS_REDE,
      quantidadeBalancas: cobranca.quantidadeApurada,
      valor: cobranca.valorTotal,
      asaasSubscriptionId: null,
    };
    // Reaproveita tanto a assinatura cancelada quanto a que nasceu com a rede
    // e ainda não foi ativada (sem assinatura no Asaas).
    const reaproveitada = await this.prisma.assinatura.updateMany({
      where: {
        clienteId,
        dominioRede,
        OR: [{ status: "CANCELADA" }, { status: "TRIAL", asaasSubscriptionId: null }],
      },
      data: reserva,
    });
    if (reaproveitada.count === 0) {
      try {
        await this.prisma.assinatura.create({ data: { clienteId, dominioRede, ...reserva } });
      } catch {
        // @@unique([clienteId, dominioRede]): já existe assinatura não cancelada.
        throw new BadRequestException("Esta rede já possui uma assinatura ativa.");
      }
    }

    const customer = await this.asaas.createCustomer({
      name: `${cliente.nome} — rede ${dominioRede}`,
      cpfCnpj: dto.cpfCnpj,
      externalReference: `${cliente.id}:${dominioRede}`,
    });

    const proximoVencimento = new Date();
    proximoVencimento.setDate(proximoVencimento.getDate() + 1);

    const subscription = await this.asaas.createSubscription({
      customer: customer.id,
      billingType: ASAAS_BILLING_TYPE[dto.formaPagamento],
      value: cobranca.valorTotal,
      nextDueDate: proximoVencimento.toISOString().slice(0, 10),
      description: `PesoHub — ${dominioRede} (${cobranca.quantidadeFaturada} balança(s))`,
    });

    // A linha já existe (reservada acima): aqui só se anotam os ids do Asaas.
    // Segue aguardando o primeiro pagamento; quem confirma é o Asaas.
    return this.prisma.assinatura.update({
      where: { clienteId_dominioRede: { clienteId, dominioRede } },
      data: { asaasCustomerId: customer.id, asaasSubscriptionId: subscription.id, proximoVencimento },
    });
  }

  /**
   * Situação da rede. É LEITURA PURA: consultar não altera valor nem chama o
   * Asaas. Antes o GET recalculava — e GET não passa pelo bloqueio de
   * inadimplência, além de multiplicar chamadas à API a cada refresh.
   * A `previa` mostra quanto ficaria com as balanças de hoje.
   */
  async status(clienteId: string, dominioRede: string | null) {
    // findFirst e não findUnique: a chave composta do Prisma não aceita nulo,
    // e assinatura antiga (nível da empresa) tem dominioRede nulo.
    const assinatura = await this.prisma.assinatura.findFirst({
      where: { clienteId, dominioRede },
      include: { faturas: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!assinatura) {
      throw new NotFoundException("Nenhuma assinatura encontrada para esta rede.");
    }
    const quantidadeAtual = await this.contarBalancasDaRede(clienteId, dominioRede);
    const previa = calcularCobranca(
      quantidadeAtual,
      Number(assinatura.valorUnitario) || VALOR_POR_BALANCA,
      assinatura.quantidadeMinima,
    );

    // A tela precisa dizer ao gerente EXATAMENTE o que o guard vai fazer e
    // quando — "em atraso" sem data é o que faz a pessoa ligar para o suporte.
    // Mesma conta do guard, pela mesma função (card #99).
    const situacao = situacaoDaAssinatura(assinatura.status, assinatura.proximoVencimento);
    const bloqueio = {
      situacao,
      bloqueado: situacao === "BLOQUEADA" || situacao === "CANCELADA",
      diasDeCarencia: DIAS_DE_CARENCIA,
      bloqueiaEm: limiteDeCarencia(assinatura.proximoVencimento),
    };
    // A assinatura nasce junto com a rede, sem nada no Asaas ainda (card #99).
    // A tela precisa distinguir "ainda não ativada" de "em teste": é a
    // diferença entre pedir a forma de pagamento e não pedir nada.
    const aguardandoAtivacao = !assinatura.asaasSubscriptionId && assinatura.status !== "CANCELADA";
    return { ...assinatura, previa, bloqueio, aguardandoAtivacao };
  }

  /**
   * Situação de cobrança da rede de QUEM ESTÁ USANDO o sistema, para a faixa
   * de aviso no topo (card #100). Diferente do `status`, aqui nada estoura:
   * é consultado a cada carregamento, por qualquer papel, e quem não pertence
   * a uma rede (ou está em dia) simplesmente não vê faixa nenhuma.
   */
  async avisoDaRede(usuario: { sub: string; clienteId: string | null }) {
    if (!usuario.clienteId) return { emAtraso: false as const };

    const eu = await this.prisma.user.findUnique({ where: { id: usuario.sub }, select: { email: true } });
    const dominio = normalizarDominio(eu?.email.split("@")[1]);
    if (!dominio) return { emAtraso: false as const };

    const loja = await this.prisma.loja.findFirst({
      where: { clienteId: usuario.clienteId, dominioEmail: dominio },
      select: { id: true },
    });
    if (!loja) return { emAtraso: false as const };

    const assinatura = await this.prisma.assinatura.findFirst({
      where: { clienteId: usuario.clienteId, dominioRede: dominio },
      include: {
        faturas: {
          where: { status: { in: ["PENDENTE", "VENCIDA"] } },
          orderBy: { dataVencimento: "asc" },
          take: 1,
        },
      },
    });
    if (!assinatura) return { emAtraso: false as const };

    const situacao = situacaoDaAssinatura(assinatura.status, assinatura.proximoVencimento);
    if (situacao !== "ATRASADA" && situacao !== "BLOQUEADA") return { emAtraso: false as const };

    return {
      emAtraso: true as const,
      situacao,
      valor: String(assinatura.valor),
      vencimento: assinatura.proximoVencimento,
      bloqueiaEm: limiteDeCarencia(assinatura.proximoVencimento),
      diasDeCarencia: DIAS_DE_CARENCIA,
      linkPagamento: assinatura.faturas[0]?.linkPagamento ?? null,
    };
  }

  /**
   * Recalcula o valor pela quantidade atual de balanças e avisa o Asaas.
   * Escrita de verdade: só por ação explícita, nunca dentro de uma consulta.
   */
  async recalcular(assinaturaId: string) {
    const assinatura = await this.prisma.assinatura.findUniqueOrThrow({
      where: { id: assinaturaId },
      include: { faturas: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (assinatura.status === "CANCELADA") return assinatura;
    // Sem rede, "contar balanças" seria o parque inteiro da empresa — e esse
    // valor, multiplicado por milhares, iria parar no Asaas.
    if (!assinatura.dominioRede) {
      throw new BadRequestException("Assinatura antiga (sem rede) não é recalculada automaticamente.");
    }

    const quantidade = await this.contarBalancasDaRede(assinatura.clienteId, assinatura.dominioRede);
    const cobranca = calcularCobranca(
      quantidade,
      Number(assinatura.valorUnitario) || VALOR_POR_BALANCA,
      assinatura.quantidadeMinima,
    );
    if (cobranca.valorTotal === Number(assinatura.valor) && quantidade === assinatura.quantidadeBalancas) {
      return assinatura;
    }

    if (assinatura.asaasSubscriptionId) {
      await this.asaas.updateSubscriptionValue(assinatura.asaasSubscriptionId, cobranca.valorTotal);
    }
    return this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { quantidadeBalancas: quantidade, valor: cobranca.valorTotal },
      include: { faturas: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
  }

  async cancel(clienteId: string, dominioRede: string | null) {
    const assinatura = await this.prisma.assinatura.findFirst({ where: { clienteId, dominioRede } });
    if (!assinatura) {
      throw new NotFoundException("Nenhuma assinatura encontrada para esta rede.");
    }
    if (assinatura.asaasSubscriptionId) {
      await this.asaas.cancelSubscription(assinatura.asaasSubscriptionId);
    }
    return this.prisma.assinatura.update({ where: { id: assinatura.id }, data: { status: "CANCELADA" } });
  }

  /** Assinaturas de todas as redes da empresa (visão de quem administra). */
  async listarAssinaturas(clienteId: string) {
    return this.prisma.assinatura.findMany({
      where: { clienteId },
      orderBy: { dominioRede: "asc" },
      include: { faturas: { orderBy: { createdAt: "desc" }, take: 3 } },
    });
  }

  /**
   * Webhook do Asaas.
   *
   * Idempotente pelo id do evento: o mesmo evento chega mais de uma vez e não
   * pode gerar dois registros. E o estado financeiro vem do status ATUAL da
   * cobrança consultado na API, não do evento — assim um "venceu" que chega
   * atrasado não bloqueia quem já pagou.
   */
  async handleWebhookEvent(eventoId: string | undefined, evento: string, payment: Record<string, unknown>) {
    const asaasPaymentId = typeof payment?.id === "string" ? payment.id : undefined;
    // Sem id do evento, o próprio par evento+cobrança serve de chave.
    const chave = eventoId ?? (asaasPaymentId ? `${evento}:${asaasPaymentId}` : null);
    if (!chave || !asaasPaymentId) return { ignorado: "evento sem identificação" };

    try {
      await this.prisma.eventoAsaas.create({
        data: { eventoId: chave, tipo: evento, asaasPaymentId, payload: payment as object },
      });
    } catch (err) {
      // Só a violação da chave única significa "já processamos". Qualquer
      // outra falha (banco fora, payload inválido) precisa estourar: dar o
      // evento como visto faria o Asaas nunca reenviar.
      if ((err as { code?: string }).code === "P2002") return { duplicado: true };
      throw err;
    }

    let resultado = "sem efeito";
    try {
      // Fonte da verdade é o Asaas, não o corpo do webhook.
      const atual = await this.asaas.getPayment(asaasPaymentId);
      const statusFatura = ASAAS_STATUS_TO_FATURA[atual.status];
      if (statusFatura) {
        resultado = (await this.aplicarStatus(asaasPaymentId, atual, statusFatura)) ?? resultado;
      }
    } catch (err) {
      resultado = `erro: ${(err as Error).message}`;
      this.logger.error(`Falha ao processar evento ${chave}: ${resultado}`);
      await this.prisma.eventoAsaas.update({ where: { eventoId: chave }, data: { resultado } });
      // Propaga para o Asaas receber erro e reenviar. Engolir aqui deixaria
      // uma rede que PAGOU marcada como inadimplente e bloqueada.
      throw err;
    }
    await this.prisma.eventoAsaas.update({
      where: { eventoId: chave },
      data: { processadoEm: new Date(), resultado },
    });
    return { processado: true, resultado };
  }

  private async aplicarStatus(
    asaasPaymentId: string,
    pagamento: { value?: number; dueDate?: string; paymentDate?: string; invoiceUrl?: string; subscription?: string },
    statusFatura: "PENDENTE" | "CONFIRMADA" | "RECEBIDA" | "VENCIDA" | "CANCELADA",
  ): Promise<string | null> {
    // 1) Competência do contrato da fabricante.
    const competencia = await this.prisma.competenciaFaturada.findUnique({ where: { asaasPaymentId } });
    if (competencia) {
      const status =
        statusFatura === "RECEBIDA" || statusFatura === "CONFIRMADA"
          ? "PAGA"
          : statusFatura === "VENCIDA"
            ? "VENCIDA"
            : statusFatura === "CANCELADA"
              ? "CANCELADA"
              : "COBRADA";
      await this.prisma.competenciaFaturada.update({
        where: { id: competencia.id },
        data: {
          status,
          dataPagamento: pagamento.paymentDate ? new Date(pagamento.paymentDate) : null,
          linkPagamento: pagamento.invoiceUrl ?? competencia.linkPagamento,
        },
      });
      return `competência ${competencia.competencia} -> ${status}`;
    }

    // 2) Assinatura de uma rede.
    if (!pagamento.subscription) return null;
    const assinatura = await this.prisma.assinatura.findUnique({
      where: { asaasSubscriptionId: pagamento.subscription },
    });
    if (!assinatura) return null;

    await this.prisma.fatura.upsert({
      where: { asaasPaymentId },
      create: {
        assinaturaId: assinatura.id,
        asaasPaymentId,
        valor: pagamento.value ?? assinatura.valor,
        status: statusFatura,
        linkPagamento: pagamento.invoiceUrl ?? null,
        dataVencimento: pagamento.dueDate ? new Date(pagamento.dueDate) : null,
        dataPagamento: pagamento.paymentDate ? new Date(pagamento.paymentDate) : null,
      },
      update: {
        status: statusFatura,
        dataPagamento: pagamento.paymentDate ? new Date(pagamento.paymentDate) : null,
      },
    });

    const statusAssinatura =
      statusFatura === "RECEBIDA" || statusFatura === "CONFIRMADA"
        ? "ATIVA"
        : statusFatura === "VENCIDA"
          ? "INADIMPLENTE"
          : undefined;
    if (statusAssinatura) {
      await this.prisma.assinatura.update({
        where: { id: assinatura.id },
        data: {
          status: statusAssinatura,
          proximoVencimento: pagamento.dueDate ? new Date(pagamento.dueDate) : assinatura.proximoVencimento,
        },
      });
    }
    return `assinatura ${assinatura.dominioRede ?? "empresa"} -> ${statusAssinatura ?? statusFatura}`;
  }
}
