import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { getRedisConnectionOptions } from "./redis-connection";

/**
 * Fila de sincronização (Redis + BullMQ), conforme SPEC.md Módulo 3.
 * Retry automático com backoff exponencial.
 *
 * As opções padrão de job vivem aqui, no lado que ENFILEIRA: no BullMQ é o
 * produtor que define tentativas e backoff, não o worker que consome.
 */
@Module({
  imports: [
    BullModule.forRoot({
      connection: getRedisConnectionOptions(),
    }),
    BullModule.registerQueue({
      name: "sync-jobs",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        // Sem isso o Redis acumula todo job já concluído para sempre — com
        // 200 mil balanças sincronizando, isso vira memória que nunca volta.
        removeOnComplete: { age: 3600, count: 5000 },
        removeOnFail: { age: 86400 },
      },
    }),
  ],
  exports: [BullModule],
})
export class SyncQueueModule {}
