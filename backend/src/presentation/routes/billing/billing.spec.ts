import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { ContratoService } from "./contrato.service";

/**
 * Card #97 — o que se protege aqui é dinheiro: valor decidido pelo backend,
 * evento do Asaas processado uma vez só, evento fora de ordem sem efeito, e
 * uma rede nunca enxergando a cobrança da outra.
 */
describe("ContratoService — contrato da fabricante", () => {
  const contrato = {
    id: "c1",
    clienteId: "ramuza",
    valorUnitario: 40,
    quantidadeMinima: 400,
    diaVencimento: 10,
    asaasCustomerId: "cus_1",
    ativo: true,
  };

  function montar(devices: number, competenciaExistente: unknown = null) {
    const prisma = {
      contratoLicenciamento: { findUnique: jest.fn().mockResolvedValue(contrato), update: jest.fn() },
      competenciaFaturada: {
        findUnique: jest.fn().mockResolvedValue(competenciaExistente),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "f1", ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "f1", ...data })),
      },
      device: { count: jest.fn().mockResolvedValue(devices) },
      cliente: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "ramuza", nome: "Ramuza" }) },
    };
    const asaas = {
      createPayment: jest.fn().mockResolvedValue({ id: "pay_1", invoiceUrl: "https://asaas/x" }),
      createCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
    };
    return { servico: new ContratoService(prisma as never, asaas as never), prisma, asaas };
  }

  it("com 120 balanças cobra o mínimo de 400 (R$ 16.000)", async () => {
    const { servico } = montar(120);
    await expect(servico.apurar("ramuza", "2026-08")).resolves.toMatchObject({
      quantidadeApurada: 120,
      quantidadeFaturada: 400,
      valorTotal: 16000,
    });
  });

  it("com 650 balanças cobra R$ 26.000", async () => {
    const { servico } = montar(650);
    await expect(servico.apurar("ramuza", "2026-08")).resolves.toMatchObject({ valorTotal: 26000 });
  });

  it("conta só as balanças cadastradas até o fim da competência", async () => {
    const { servico, prisma } = montar(400);
    await servico.apurar("ramuza", "2026-08");
    expect(prisma.device.count.mock.calls[0][0].where.createdAt.lt.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("competência que ficou só apurada (Asaas caiu) é retomada no retry", async () => {
    const apurada = {
      id: "f1",
      competencia: "2026-08",
      status: "APURADA",
      asaasPaymentId: null,
      valorTotal: 26000,
      dataVencimento: new Date("2026-09-10T00:00:00Z"),
    };
    const { servico, asaas, prisma } = montar(650, apurada);
    await servico.fechar("ramuza", "2026-08");
    // Cobra, mas sem criar uma segunda linha para o mesmo mês.
    expect(asaas.createPayment).toHaveBeenCalledTimes(1);
    expect(prisma.competenciaFaturada.create).not.toHaveBeenCalled();
  });

  it("fechar duas vezes a mesma competência não cobra de novo", async () => {
    const jaFechada = { id: "f1", competencia: "2026-08", status: "COBRADA", asaasPaymentId: "pay_1" };
    const { servico, asaas } = montar(650, jaFechada);
    await expect(servico.fechar("ramuza", "2026-08")).resolves.toBe(jaFechada);
    expect(asaas.createPayment).not.toHaveBeenCalled();
  });

  it("não fecha competência que ainda não terminou", async () => {
    const { servico } = montar(650);
    const mesQueVem = new Date();
    mesQueVem.setMonth(mesQueVem.getMonth() + 1);
    const competencia = `${mesQueVem.getFullYear()}-${String(mesQueVem.getMonth() + 1).padStart(2, "0")}`;
    await expect(servico.fechar("ramuza", competencia)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("congela o valor unitário na competência fechada", async () => {
    const { servico, prisma, asaas } = montar(650);
    await servico.fechar("ramuza", "2026-08");
    expect(prisma.competenciaFaturada.create.mock.calls[0][0].data).toMatchObject({
      valorUnitario: 40,
      quantidadeFaturada: 650,
      valorTotal: 26000,
    });
    expect(asaas.createPayment.mock.calls[0][0].value).toBe(26000);
  });
});

describe("BillingService — assinatura da rede", () => {
  const lojaDaRede = { id: "davo-1" };

  function montar(over: Record<string, unknown> = {}) {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ email: "gerente@davo.com.br" }) },
      loja: { findFirst: jest.fn().mockResolvedValue(lojaDaRede), count: jest.fn().mockResolvedValue(2) },
      device: { count: jest.fn().mockResolvedValue(3) },
      cliente: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "ramuza", nome: "Ramuza" }) },
      assinatura: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "a1", ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "a1", ...data })),
      },
      fatura: { upsert: jest.fn().mockResolvedValue({}) },
      competenciaFaturada: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
      eventoAsaas: { create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}) },
      ...over,
    };
    const asaas = {
      createCustomer: jest.fn().mockResolvedValue({ id: "cus_1" }),
      createSubscription: jest.fn().mockResolvedValue({ id: "sub_1" }),
      updateSubscriptionValue: jest.fn().mockResolvedValue({}),
      getPayment: jest.fn(),
    };
    return { servico: new BillingService(prisma as never, asaas as never), prisma, asaas };
  }

  const gerente = { sub: "u1", role: "ADMIN_REDE", clienteId: "ramuza" };

  it("o valor vem das balanças, não da tela", async () => {
    const { servico, asaas, prisma } = montar();
    await servico.subscribe("ramuza", "davo.com.br", {
      formaPagamento: "PIX",
      cpfCnpj: "12345678000199",
      // Mesmo que a tela mande um valor, ele não existe no DTO — e o cobrado
      // sai de 3 balanças x R$ 40.
    } as never);
    expect(asaas.createSubscription.mock.calls[0][0].value).toBe(120);
    expect(prisma.assinatura.create.mock.calls[0][0].data).toMatchObject({ valor: 120, quantidadeBalancas: 3 });
  });

  it("assinatura nasce aguardando o pagamento, não ativa", async () => {
    const { servico, prisma } = montar();
    await servico.subscribe("ramuza", "davo.com.br", { formaPagamento: "PIX", cpfCnpj: "1" } as never);
    expect(prisma.assinatura.create.mock.calls[0][0].data.status).toBe("TRIAL");
  });

  it("funcionário de uma rede não alcança a cobrança de outra", async () => {
    const { servico } = montar();
    await expect(servico.resolverRede(gerente, "redeavo.com.br")).rejects.toBeInstanceOf(ForbiddenException);
    await expect(servico.resolverRede(gerente, "davo.com.br")).resolves.toBe("davo.com.br");
  });

  it("quem não é da rede nem administra não gerencia assinatura", async () => {
    const { servico } = montar({ loja: { findFirst: jest.fn().mockResolvedValue(null), count: jest.fn() } });
    await expect(
      servico.resolverRede({ sub: "u2", role: "OPERADOR", clienteId: "ramuza" }, "davo.com.br"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("evento repetido do Asaas é ignorado", async () => {
    const { servico, prisma, asaas } = montar({
      eventoAsaas: {
        create: jest.fn().mockRejectedValue(Object.assign(new Error("unique constraint"), { code: "P2002" })),
        update: jest.fn(),
      },
    });
    await expect(servico.handleWebhookEvent("evt_1", "PAYMENT_RECEIVED", { id: "pay_1" })).resolves.toEqual({
      duplicado: true,
    });
    expect(asaas.getPayment).not.toHaveBeenCalled();
    expect(prisma.fatura.upsert).not.toHaveBeenCalled();
  });

  it("evento atrasado não derruba quem já pagou: vale o status atual no Asaas", async () => {
    const { servico, prisma, asaas } = montar({
      assinatura: {
        findUnique: jest.fn().mockResolvedValue({ id: "a1", dominioRede: "davo.com.br", valor: 120 }),
        update: jest.fn().mockResolvedValue({}),
      },
    });
    // Chega um "venceu", mas a cobrança já está recebida no Asaas.
    asaas.getPayment.mockResolvedValue({ id: "pay_1", status: "RECEIVED", subscription: "sub_1", value: 120 });

    await servico.handleWebhookEvent("evt_2", "PAYMENT_OVERDUE", { id: "pay_1", subscription: "sub_1" });

    expect(prisma.fatura.upsert.mock.calls[0][0].create.status).toBe("RECEBIDA");
    expect(prisma.assinatura.update.mock.calls[0][0].data.status).toBe("ATIVA");
  });

  it("pagamento de competência da fabricante não vira fatura de assinatura", async () => {
    const { servico, prisma, asaas } = montar({
      competenciaFaturada: {
        findUnique: jest.fn().mockResolvedValue({ id: "f1", competencia: "2026-08", linkPagamento: null }),
        update: jest.fn().mockResolvedValue({}),
      },
    });
    asaas.getPayment.mockResolvedValue({ id: "pay_9", status: "RECEIVED" });

    await servico.handleWebhookEvent("evt_3", "PAYMENT_RECEIVED", { id: "pay_9" });

    expect(prisma.competenciaFaturada.update.mock.calls[0][0].data.status).toBe("PAGA");
    expect(prisma.fatura.upsert).not.toHaveBeenCalled();
  });

  it("a vaga é reservada no banco ANTES de criar a assinatura no Asaas", async () => {
    const { servico, prisma, asaas } = montar();
    await servico.subscribe("ramuza", "davo.com.br", { formaPagamento: "PIX", cpfCnpj: "1" } as never);
    const ordemReserva = prisma.assinatura.create.mock.invocationCallOrder[0];
    const ordemAsaas = asaas.createSubscription.mock.invocationCallOrder[0];
    expect(ordemReserva).toBeLessThan(ordemAsaas);
  });

  it("pedido simultâneo não cria uma segunda assinatura no Asaas", async () => {
    const { servico, asaas } = montar({
      assinatura: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        // A corrida perde na chave única do banco.
        create: jest.fn().mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" })),
      },
    });
    await expect(
      servico.subscribe("ramuza", "davo.com.br", { formaPagamento: "PIX", cpfCnpj: "1" } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(asaas.createSubscription).not.toHaveBeenCalled();
  });

  it("consultar a situação não altera nada nem chama o Asaas", async () => {
    const { servico, prisma, asaas } = montar({
      assinatura: {
        findFirst: jest.fn().mockResolvedValue({
          id: "a1",
          clienteId: "ramuza",
          dominioRede: "davo.com.br",
          valor: 80,
          valorUnitario: 40,
          quantidadeMinima: 1,
          quantidadeBalancas: 2,
          status: "ATIVA",
        }),
        update: jest.fn(),
      },
    });
    const r = await servico.status("ramuza", "davo.com.br");

    expect(r.previa).toMatchObject({ quantidadeFaturada: 3, valorTotal: 120 });
    expect(prisma.assinatura.update).not.toHaveBeenCalled();
    expect(asaas.updateSubscriptionValue).not.toHaveBeenCalled();
  });

  it("assinatura antiga (sem rede) não é reprecificada com o parque inteiro", async () => {
    const { servico, asaas } = montar({
      assinatura: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: "a1",
          clienteId: "ramuza",
          dominioRede: null,
          status: "ATIVA",
          valor: 199,
          valorUnitario: 40,
          quantidadeMinima: 1,
          quantidadeBalancas: 0,
        }),
        update: jest.fn(),
      },
    });
    await expect(servico.recalcular("a1")).rejects.toBeInstanceOf(BadRequestException);
    expect(asaas.updateSubscriptionValue).not.toHaveBeenCalled();
  });

  it("falha de banco no registro do evento não é confundida com duplicata", async () => {
    const { servico } = montar({
      eventoAsaas: { create: jest.fn().mockRejectedValue(new Error("banco fora")), update: jest.fn() },
    });
    await expect(servico.handleWebhookEvent("evt_9", "PAYMENT_RECEIVED", { id: "pay_1" })).rejects.toThrow(
      "banco fora",
    );
  });

  it("falha ao processar devolve erro para o Asaas reenviar", async () => {
    const { servico, prisma, asaas } = montar();
    asaas.getPayment.mockRejectedValue(new Error("timeout"));

    await expect(servico.handleWebhookEvent("evt_10", "PAYMENT_RECEIVED", { id: "pay_1" })).rejects.toThrow("timeout");
    // O evento fica registrado com o erro, mas NÃO como processado.
    expect(prisma.eventoAsaas.update.mock.calls[0][0].data.processadoEm).toBeUndefined();
  });
});
