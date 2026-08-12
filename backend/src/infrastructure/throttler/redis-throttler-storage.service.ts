import { Injectable, OnModuleDestroy } from "@nestjs/common";
import type { ThrottlerStorage } from "@nestjs/throttler";
import type { ThrottlerStorageRecord } from "@nestjs/throttler/dist/throttler-storage-record.interface";
import Redis from "ioredis";
import { getRedisUrl } from "../queue/redis-connection";

/**
 * Storage do @nestjs/throttler baseado em Redis, para o rate-limit funcionar
 * corretamente quando o backend escala horizontalmente no Railway — a
 * implementação padrão do throttler guarda os contadores em memória do
 * processo, então cada instância teria seu próprio limite isolado (na
 * prática, N instâncias = limite multiplicado por N). Usa o mesmo Redis do
 * Bull (ver redis-connection.ts), com INCR/PEXPIRE atômicos por chave.
 */
@Injectable()
export class RedisThrottlerStorageService implements ThrottlerStorage, OnModuleDestroy {
  private readonly redis = new Redis(getRedisUrl());

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `throttler:${throttlerName}:${key}`;
    const blockKey = `${hitKey}:blocked`;

    const blockTtl = await this.redis.pttl(blockKey);
    if (blockTtl > 0) {
      return { totalHits: limit + 1, timeToExpire: 0, isBlocked: true, timeToBlockExpire: blockTtl };
    }

    const totalHits = await this.redis.incr(hitKey);
    if (totalHits === 1) {
      await this.redis.pexpire(hitKey, ttl);
    }
    const timeToExpire = await this.redis.pttl(hitKey);

    let isBlocked = false;
    let timeToBlockExpire = 0;
    if (totalHits > limit && blockDuration > 0) {
      isBlocked = true;
      timeToBlockExpire = blockDuration;
      await this.redis.set(blockKey, "1", "PX", blockDuration);
    }

    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire };
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
