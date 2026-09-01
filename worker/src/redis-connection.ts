import type { ConnectionOptions } from "bullmq";

/**
 * Provedores gerenciados (ex: Railway) expõem uma única REDIS_URL com
 * credenciais embutidas (redis://default:senha@host:port). Em dev local
 * seguimos aceitando REDIS_HOST/REDIS_PORT separados, sem senha.
 */
export function getRedisUrl(): string {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST ?? "localhost";
  const port = process.env.REDIS_PORT ?? "6379";
  return `redis://${host}:${port}`;
}

/**
 * `maxRetriesPerRequest: null` é exigência do BullMQ: o Worker mantém uma
 * conexão bloqueante esperando por jobs, e o limite padrão de tentativas do
 * ioredis derrubaria essa conexão.
 */
export function getRedisConnectionOptions(): ConnectionOptions {
  return { url: getRedisUrl(), maxRetriesPerRequest: null };
}
