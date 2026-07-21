import Queue from "bull";
import { AgentBridge } from "./agent-bridge";
import { createSyncProcessor } from "./processor";
import { prisma } from "./prisma";
import { logger } from "./logger";

// Provedores gerenciados (ex: Railway) expõem uma única REDIS_URL com
// credenciais embutidas. Em dev local seguimos aceitando REDIS_HOST/REDIS_PORT.
const REDIS_URL =
  process.env.REDIS_URL ?? `redis://${process.env.REDIS_HOST ?? "localhost"}:${process.env.REDIS_PORT ?? 6379}`;

const agentBridge = new AgentBridge(REDIS_URL);

const syncQueue = new Queue("sync-jobs", REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});

syncQueue.process("sync-device", 5, createSyncProcessor(agentBridge));

syncQueue.on("completed", (job) => {
  logger.info({ jobId: job.id, result: job.returnvalue }, "sync job concluído");
});

syncQueue.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "sync job falhou");
});

logger.info(`Worker de sincronização ativo — ouvindo fila "sync-jobs" em ${REDIS_URL}`);

async function shutdown() {
  logger.info("Encerrando worker...");
  await syncQueue.close();
  await agentBridge.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
