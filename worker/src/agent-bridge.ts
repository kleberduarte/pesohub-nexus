import Redis from "ioredis";
import { randomUUID } from "crypto";

/**
 * Ponte Worker <-> Agent Local via Redis pub/sub.
 * O Agent Local não fica conectado ao worker diretamente — ele mantém uma conexão
 * WebSocket com o backend (AgentGateway). O backend relaciona os canais Redis
 * abaixo com o socket do agente correto.
 */
export interface SyncCommandPayload {
  deviceId: string;
  deviceIp: string;
  devicePort: number;
  tipo: "TOTAL" | "INCREMENTAL";
  products: Array<{
    codigo: string;
    codigoBarras: string;
    nome: string;
    preco: number;
    categoriaImposto?: string;
  }>;
}

export interface SyncCommandResult {
  ok: boolean;
  erro?: string;
  itensProcessados?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export class AgentBridge {
  private readonly pub: Redis;
  private readonly sub: Redis;
  private readonly pending = new Map<string, (result: SyncCommandResult) => void>();

  constructor(redisUrl: string) {
    this.pub = new Redis(redisUrl);
    this.sub = new Redis(redisUrl);
    this.sub.psubscribe("agent:result:*");
    this.sub.on("pmessage", (_pattern, channel, message) => {
      const correlationId = channel.split(":")[2];
      const resolve = this.pending.get(correlationId);
      if (!resolve) return;
      this.pending.delete(correlationId);
      resolve(JSON.parse(message) as SyncCommandResult);
    });
  }

  /**
   * Envia o comando para o Agent Local responsável pelo dispositivo (via backend)
   * e aguarda o resultado. Se o agente não estiver conectado, o backend nunca
   * publica em agent:result:<correlationId> e a promise expira em timeout.
   */
  async sendToAgent(
    agentId: string,
    payload: SyncCommandPayload,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<SyncCommandResult> {
    const correlationId = randomUUID();

    const resultPromise = new Promise<SyncCommandResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(correlationId);
        reject(new Error(`Timeout aguardando resposta do Agent Local (agentId=${agentId})`));
      }, timeoutMs);

      this.pending.set(correlationId, (result) => {
        clearTimeout(timer);
        resolve(result);
      });
    });

    await this.pub.publish(
      `agent:command:${agentId}`,
      JSON.stringify({ correlationId, ...payload }),
    );

    return resultPromise;
  }

  async close(): Promise<void> {
    await this.pub.quit();
    await this.sub.quit();
  }
}
