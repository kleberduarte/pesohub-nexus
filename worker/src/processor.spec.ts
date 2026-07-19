jest.mock("./prisma", () => ({
  prisma: {
    device: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
    product: { findMany: jest.fn() },
    syncJob: { create: jest.fn(), update: jest.fn() },
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
};

describe("createSyncProcessor", () => {
  const device = { id: "device-1", clienteId: "cliente-a", agentId: "agent-1", nome: "Balança 1", ip: "10.0.0.5", porta: 33581 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.device.findUniqueOrThrow.mockResolvedValue(device);
    mockedPrisma.product.findMany.mockResolvedValue([]);
    mockedPrisma.syncJob.create.mockResolvedValue({ id: "job-1" });
  });

  it("filtra produtos TOTAL pelo clienteId do device (não vaza entre tenants)", async () => {
    const agentBridge = { sendToAgent: jest.fn().mockResolvedValue({ ok: true }) };
    const process = createSyncProcessor(agentBridge as any);

    await process({ data: { deviceId: "device-1", tipo: "TOTAL" } });

    expect(mockedPrisma.product.findMany).toHaveBeenCalledWith({
      where: { ativo: true, clienteId: "cliente-a" },
    });
  });

  it("filtra produtos INCREMENTAL por productIds E clienteId do device", async () => {
    const agentBridge = { sendToAgent: jest.fn().mockResolvedValue({ ok: true }) };
    const process = createSyncProcessor(agentBridge as any);

    await process({ data: { deviceId: "device-1", tipo: "INCREMENTAL", productIds: ["p1", "p2"] } });

    expect(mockedPrisma.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["p1", "p2"] }, clienteId: "cliente-a" },
    });
  });
});
