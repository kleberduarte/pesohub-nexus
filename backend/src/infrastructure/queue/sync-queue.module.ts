import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";

/**
 * Fila de sincronização (Redis + Bull), conforme SPEC.md Módulo 3.
 * Retry automático com backoff exponencial; processor a implementar na Fase 4.
 */
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({
      name: "sync-jobs",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    }),
  ],
  exports: [BullModule],
})
export class SyncQueueModule {}
