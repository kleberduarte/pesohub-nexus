import { BadRequestException, NotFoundException } from "@nestjs/common";
import { BillingService } from "./billing.service";

/**
 * Card #101 — Pix e boleto na tela. O risco aqui não é visual: um id de fatura
 * é a chave para ler a cobrança de alguém, então o teste central é o escopo —
 * fatura de outra rede tem que responder o mesmo que fatura inexistente. E o
 * caminho inteiro precisa ser leitura: nada pode ser emitido no Asaas.
 */
const USUARIO = { sub: "u1", role: "ADMIN_REDE", clienteId: "cli_1" };

function montar(fatura: unknown, asaasOver: Record<string, unknown> = {}) {
  const prisma = {
    user: { findUnique: jest.fn(() => Promise.resolve({ email: "gerente@davo.com.br" })) },
    loja: { findFirst: jest.fn(() => Promise.resolve({ id: "loja_1" })) },
    fatura: { findUnique: jest.fn(() => Promise.resolve(fatura)) },
  };
  const asaas = {
    getPixQrCode: jest.fn(() => Promise.resolve({ encodedImage: "iVBORw0KGgo=", payload: "00020126BR..." })),
    getLinhaDigitavel: jest.fn(() => Promise.resolve({ identificationField: "34191.79001 01043.510047", barCode: "34191790" })),
    createPayment: jest.fn(),
    createSubscription: jest.fn(),
    createCustomer: jest.fn(),
    ...asaasOver,
  };
  const service = new BillingService(prisma as never, asaas as never);
  return { service, prisma, asaas };
}

const faturaDaRede = {
  id: "fat_1",
  asaasPaymentId: "pay_1",
  valor: 120,
  status: "PENDENTE",
  dataVencimento: new Date("2026-10-10T00:00:00.000Z"),
  linkPagamento: "https://asaas.test/i/1",
  assinatura: { clienteId: "cli_1", dominioRede: "davo.com.br" },
};

it("devolve Pix e boleto da fatura da própria rede", async () => {
  const { service, asaas } = montar(faturaDaRede);

  const dados = await service.dadosDePagamento(USUARIO, "fat_1");

  expect(dados.pix).toMatchObject({ copiaECola: "00020126BR...", qrCodeBase64: "iVBORw0KGgo=" });
  expect(dados.boleto).toMatchObject({ linhaDigitavel: "34191.79001 01043.510047" });
  // Leitura pura: nada emitido.
  expect(asaas.createPayment).not.toHaveBeenCalled();
  expect(asaas.createSubscription).not.toHaveBeenCalled();
});

it("fatura de outra rede responde igual a fatura inexistente", async () => {
  const { service } = montar({ ...faturaDaRede, assinatura: { clienteId: "cli_1", dominioRede: "concorrente.com.br" } });

  await expect(service.dadosDePagamento(USUARIO, "fat_1")).rejects.toBeInstanceOf(NotFoundException);
});

it("fatura de outra empresa também não é encontrada", async () => {
  const { service } = montar({ ...faturaDaRede, assinatura: { clienteId: "outra_empresa", dominioRede: "davo.com.br" } });

  await expect(service.dadosDePagamento(USUARIO, "fat_1")).rejects.toBeInstanceOf(NotFoundException);
});

it("não oferece pagamento de fatura já paga", async () => {
  const { service } = montar({ ...faturaDaRede, status: "RECEBIDA" });

  await expect(service.dadosDePagamento(USUARIO, "fat_1")).rejects.toBeInstanceOf(BadRequestException);
});

it("boleto indisponível não derruba o Pix", async () => {
  const { service } = montar(faturaDaRede, {
    getLinhaDigitavel: jest.fn(() => Promise.reject(new Error("cobrança sem boleto"))),
  });

  const dados = await service.dadosDePagamento(USUARIO, "fat_1");

  expect(dados.pix).not.toBeNull();
  expect(dados.boleto).toBeNull();
});

it("Pix indisponível não derruba o boleto", async () => {
  const { service } = montar(faturaDaRede, {
    getPixQrCode: jest.fn(() => Promise.reject(new Error("conta sem chave Pix"))),
  });

  const dados = await service.dadosDePagamento(USUARIO, "fat_1");

  expect(dados.pix).toBeNull();
  expect(dados.boleto).not.toBeNull();
});
