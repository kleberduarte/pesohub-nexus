import { Worker } from "bullmq";
import { AgentBridge } from "./agent-bridge";
import { createSyncProcessor } from "./processor";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { getRedisConnectionOptions, getRedisUrl } from "./redis-connection";

const REDIS_URL = getRedisUrl();

const agentBridge = new AgentBridge(REDIS_URL);
const processSyncJob = createSyncProcessor(agentBridge);

/**
 * No BullMQ o Worker consome todos os jobs da fila, independente do nome — o
 * Bull filtrava por nome no próprio `process()`. Como "sync-device" é o único
 * tipo enfileirado hoje, a checagem serve para falhar de forma explícita se
 * alguém acrescentar outro tipo sem tratar aqui.
 *
 * Tentativas e backoff ficam do lado que enfileira (ver
 * backend/src/infrastructure/queue/sync-queue.module.ts).
 */
const syncWorker = new Worker(
  "sync-jobs",
  async (job) => {
    if (job.name !== "sync-device") {
      throw new Error(`Tipo de job desconhecido na fila sync-jobs: ${job.name}`);
    }
    return processSyncJob(job);
  },
  { connection: getRedisConnectionOptions(), concurrency: 5 },
);

syncWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, result: job.returnvalue }, "sync job concluído");
});

syncWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "sync job falhou");
});

syncWorker.on("error", (err) => {
  logger.error({ err: err.message }, "erro na conexão da fila");
});

logger.info(`Worker de sincronização ativo — ouvindo fila "sync-jobs" em ${REDIS_URL}`);

async function shutdown() {
  logger.info("Encerrando worker...");
  await syncWorker.close();
  await agentBridge.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
