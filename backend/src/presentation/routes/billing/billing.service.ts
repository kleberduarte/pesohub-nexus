import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { AsaasService } from "../../../infrastructure/billing/asaas.service";
import { CreateAssinaturaDto } from "../../../application/dtos/create-assinatura.dto";

const ASAAS_BILLING_TYPE: Record<CreateAssinaturaDto["formaPagamento"], "PIX" | "BOLETO" | "CREDIT_CARD"> = {
  PIX: "PIX",
  BOLETO: "BOLETO",
  CARTAO_CREDITO: "CREDIT_CARD",
};

const ASAAS_EVENT_TO_STATUS_FATURA: Record<string, "CONFIRMADA" | "RECEBIDA" | "VENCIDA" | "CANCELADA"> = {
  PAYMENT_CONFIRMED: "CONFIRMADA",
  PAYMENT_RECEIVED: "RECEBIDA",
  PAYMENT_OVERDUE: "VENCIDA",
  PAYMENT_DELETED: "CANCELADA",
};

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaas: AsaasService,
  ) {}

  async subscribe(clienteId: string, dto: CreateAssinaturaDto) {
    const existing = await this.prisma.assinatura.findUnique({ where: { clienteId } });
    if (existing && existing.status !== "CANCELADA") {
      throw new BadRequestException("Este tenant já possui uma assinatura ativa.");
    }

    const cliente = await this.prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });

    const customer = await this.asaas.createCustomer({
      name: cliente.nome,
      email: cliente.suporteEmail ?? undefined,
      cpfCnpj: dto.cpfCnpj,
      externalReference: cliente.id,
    });

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);

    const subscription = await this.asaas.createSubscription({
      customer: customer.id,
      billingType: ASAAS_BILLING_TYPE[dto.formaPagamento],
      value: dto.valor,
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
      description: `Assinatura PesoHub - ${cliente.nome}`,
    });

    return this.prisma.assinatura.upsert({
      where: { clienteId },
      create: {
        clienteId,
        asaasCustomerId: customer.id,
        asaasSubscriptionId: subscription.id,
        status: "ATIVA",
        formaPagamento: dto.formaPagamento,
        valor: dto.valor,
        proximoVencimento: nextDueDate,
      },
      update: {
        asaasCustomerId: customer.id,
        asaasSubscriptionId: subscription.id,
        status: "ATIVA",
        formaPagamento: dto.formaPagamento,
        valor: dto.valor,
        proximoVencimento: nextDueDate,
      },
    });
  }

  async status(clienteId: string) {
    const assinatura = await this.prisma.assinatura.findUnique({
      where: { clienteId },
      include: { faturas: { orderBy: { createdAt: "desc" }, take: 10 } },
    });

    if (!assinatura) {
      throw new NotFoundException("Nenhuma assinatura encontrada para este tenant.");
    }

    return assinatura;
  }

  async cancel(clienteId: string) {
    const assinatura = await this.prisma.assinatura.findUnique({ where: { clienteId } });
    if (!assinatura) {
      throw new NotFoundException("Nenhuma assinatura encontrada para este tenant.");
    }

    if (assinatura.asaasSubscriptionId) {
      await this.asaas.cancelSubscription(assinatura.asaasSubscriptionId);
    }

    return this.prisma.assinatura.update({
      where: { clienteId },
      data: { status: "CANCELADA" },
    });
  }

  async handleWebhookEvent(event: string, payment: Record<string, any>) {
    const asaasSubscriptionId: string | undefined = payment.subscription;
    const asaasPaymentId: string | undefined = payment.id;

    if (!asaasSubscriptionId || !asaasPaymentId) {
      return;
    }

    const assinatura = await this.prisma.assinatura.findUnique({ where: { asaasSubscriptionId } });
    if (!assinatura) {
      return;
    }

    const statusFatura = ASAAS_EVENT_TO_STATUS_FATURA[event];
    if (!statusFatura) {
      return;
    }

    await this.prisma.fatura.upsert({
      where: { asaasPaymentId },
      create: {
        assinaturaId: assinatura.id,
        asaasPaymentId,
        valor: payment.value ?? assinatura.valor,
        status: statusFatura,
        linkPagamento: payment.invoiceUrl ?? null,
        dataVencimento: payment.dueDate ? new Date(payment.dueDate) : null,
        dataPagamento: payment.paymentDate ? new Date(payment.paymentDate) : null,
      },
      update: {
        status: statusFatura,
        dataPagamento: payment.paymentDate ? new Date(payment.paymentDate) : null,
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
        data: { status: statusAssinatura },
      });
    }
  }
}
