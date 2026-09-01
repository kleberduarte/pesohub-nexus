jest.mock("./prisma", () => ({
  prisma: {
    device: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
    product: { findMany: jest.fn() },
    syncJob: { create: jest.fn(), update: jest.fn() },
    formatoImpressao: { findMany: jest.fn() },
    syncJobItem: { updateMany: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

import { prisma } from "./prisma";
import { createSyncProcessor } from "./processor";

const mockedPrisma = prisma as unknown as {
  device: { findUniqueOrThrow: jest.Mock; update: jest.Mock };
  product: { findMany: jest.Mock };
  syncJob: { create: jest.Mock; update: jest.Mock };
  syncJobItem: { updateMany: jest.Mock };
  formatoImpressao: { findMany: jest.Mock };
};

const expectedInclude = {
  tabelaNutricional: { include: { itens: { orderBy: { ordem: "asc" } } } },
  formatoImpressao: true,
  subSetor: { include: { setor: true } },
};

describe("createSyncProcessor", () => {
  const device = {
    id: "device-1",
    clienteId: "cliente-a",
    lojaId: "loja-a",
    agentId: "agent-1",
    nome: "Balança 1",
    ip: "10.0.0.5",
    porta: 33581,
  };

  const produto = {
    id: "p1",
    codigo: "1",
    codigoBarras: "789",
    nome: "Queijo",
    preco: 10,
    unidadeVenda: "PESO",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.device.findUniqueOrThrow.mockResolvedValue(device);
    // Um produto qualquer: um pacote vazio agora é erro, e os testes de filtro
    // não são sobre isso.
    mockedPrisma.product.findMany.mockResolvedValue([produto]);
    mockedPrisma.formatoImpressao.findMany.mockResolvedValue([]);
    mockedPrisma.syncJob.create.mockResolvedValue({ id: "job-1" });
  });

  it("filtra produtos TOTAL pelo lojaId do device (não vaza entre lojas)", async () => {
    const agentBridge = { sendToAgent: jest.fn().mockResolvedValue({ ok: true }) };
    const process = createSyncProcessor(agentBridge as any);

    await process({ data: { deviceId: "device-1", tipo: "TOTAL" } });

    expect(mockedPrisma.product.findMany).toHaveBeenCalledWith({
      where: { ativo: true, lojaId: "loja-a" },
      include: expectedInclude,
    });
  });

  it("filtra produtos INCREMENTAL por productIds E lojaId do device", async () => {
    const agentBridge = { sendToAgent: jest.fn().mockResolvedValue({ ok: true }) };
    const process = createSyncProcessor(agentBridge as any);

    await process({ data: { deviceId: "device-1", tipo: "INCREMENTAL", productIds: ["p1", "p2"] } });

    expect(mockedPrisma.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["p1", "p2"] }, lojaId: "loja-a" },
      include: expectedInclude,
    });
  });

  it("falha em vez de reportar sucesso quando o pacote sai sem produto e sem formato", async () => {
    mockedPrisma.product.findMany.mockResolvedValue([]);
    const agentBridge = { sendToAgent: jest.fn().mockResolvedValue({ ok: true }) };
    const process = createSyncProcessor(agentBridge as any);

    await expect(
      process({ data: { deviceId: "device-1", tipo: "INCREMENTAL", productIds: [] } }),
    ).rejects.toThrow(/nenhum produto nem formato/i);

    // Nada é enviado à balança, e a falha fica registrada para a tela mostrar.
    expect(agentBridge.sendToAgent).not.toHaveBeenCalled();
    expect(mockedPrisma.syncJob.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "ERROR" }) }),
    );
  });

  it("envia o formato pedido mesmo sem nenhum produto que o use", async () => {
    mockedPrisma.product.findMany.mockResolvedValue([]);
    mockedPrisma.formatoImpressao.findMany.mockResolvedValue([
      { id: "f1", numero: 22, nome: "Etiqueta", larguraMm: 56, alturaMm: 40, layout: { elementos: [] } },
    ]);
    const agentBridge = { sendToAgent: jest.fn().mockResolvedValue({ ok: true }) };
    const process = createSyncProcessor(agentBridge as any);

    await process({ data: { deviceId: "device-1", tipo: "INCREMENTAL", productIds: [], formatoIds: ["f1"] } });

    expect(mockedPrisma.formatoImpressao.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["f1"] }, lojaId: "loja-a" },
    });
    const payload = agentBridge.sendToAgent.mock.calls[0][1];
    expect(payload.products).toHaveLength(0);
    expect(payload.formatosImpressao).toEqual([
      expect.objectContaining({ numero: 22, nome: "Etiqueta" }),
    ]);
  });
});
