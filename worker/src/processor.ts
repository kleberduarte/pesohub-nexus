import { prisma } from "./prisma";
import { AgentBridge, SyncCommandPayload } from "./agent-bridge";

export interface SyncJobData {
  deviceId: string;
  tipo: "TOTAL" | "INCREMENTAL";
  productIds?: string[];
}

export function createSyncProcessor(agentBridge: AgentBridge) {
  return async function processSyncJob(job: { data: SyncJobData }) {
    const { deviceId, tipo, productIds } = job.data;

    const device = await prisma.device.findUniqueOrThrow({ where: { id: deviceId } });

    if (!device.agentId) {
      throw new Error(
        `Dispositivo "${device.nome}" (${device.ip}) não tem Agent Local vinculado — não é possível sincronizar.`,
      );
    }

    const products =
      tipo === "TOTAL"
        ? await prisma.product.findMany({ where: { ativo: true, clienteId: device.clienteId } })
        : await prisma.product.findMany({
            where: { id: { in: productIds ?? [] }, clienteId: device.clienteId },
          });

    const syncJob = await prisma.syncJob.create({
      data: {
        deviceId,
        tipo,
        status: "IN_PROGRESS",
        iniciadoEm: new Date(),
        items: {
          create: products.map((p) => ({
            productId: p.id,
            acao: "UPDATE",
            status: "PENDING",
          })),
        },
      },
    });

    const payload: SyncCommandPayload = {
      deviceId: device.id,
      deviceIp: device.ip,
      devicePort: device.porta,
      tipo,
      products: products.map((p) => ({
        codigo: p.codigo,
        codigoBarras: p.codigoBarras,
        nome: p.nome,
        preco: Number(p.preco),
        categoriaImposto: p.categoriaImposto ?? undefined,
      })),
    };

    try {
      const result = await agentBridge.sendToAgent(device.agentId, payload);

      if (!result.ok) {
        throw new Error(result.erro ?? "Agent Local reportou falha sem detalhe.");
      }

      await prisma.$transaction([
        prisma.syncJob.update({
          where: { id: syncJob.id },
          data: { status: "SUCCESS", concluidoEm: new Date() },
        }),
        prisma.syncJobItem.updateMany({
          where: { jobId: syncJob.id },
          data: { status: "SUCCESS" },
        }),
        prisma.device.update({
          where: { id: deviceId },
          data: { status: "ONLINE", ultimoAcesso: new Date() },
        }),
      ]);

      return { syncJobId: syncJob.id, itensProcessados: products.length };
    } catch (err) {
      const erro = err instanceof Error ? err.message : String(err);

      await prisma.$transaction([
        prisma.syncJob.update({
          where: { id: syncJob.id },
          data: { status: "ERROR", concluidoEm: new Date(), erro },
        }),
        prisma.syncJobItem.updateMany({
          where: { jobId: syncJob.id },
          data: { status: "ERROR" },
        }),
        prisma.device.update({
          where: { id: deviceId },
          data: { status: "OFFLINE" },
        }),
      ]);

      // Rethrow: Bull faz retry automático (3 tentativas, backoff exponencial — ver sync-queue.module.ts)
      throw err;
    }
  };
}
