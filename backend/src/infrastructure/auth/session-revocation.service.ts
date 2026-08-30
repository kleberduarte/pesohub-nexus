import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { getRedisUrl } from "../queue/redis-connection";

/**
 * Lista de revogação de sessões, em Redis.
 *
 * O access token é um JWT auto-contido: até então, sair da sessão apenas
 * apagava o cookie do navegador, e um token já copiado (extensão maliciosa,
 * XSS num subdomínio, máquina compartilhada de loja) continuava valendo até
 * expirar. Agora cada token carrega um `jti` e o logout registra esse `jti`
 * aqui; o JwtAuthGuard recusa qualquer token cujo `jti` esteja na lista.
 *
 * A entrada expira junto com o próprio token, então a lista nunca cresce sem
 * limite — no pior caso guarda os tokens revogados dos últimos 15 minutos.
 * Fica no mesmo Redis do throttler e da fila, e por isso vale para todas as
 * instâncias do backend.
 */
@Injectable()
export class SessionRevocationService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionRevocationService.name);
  private readonly redis = new Redis(getRedisUrl());

  private key(jti: string): string {
    return `session:revoked:${jti}`;
  }

  /**
   * @param exp `exp` do JWT, em segundos desde a época — define por quanto
   * tempo a entrada precisa sobreviver. Depois disso o próprio token expira.
   */
  async revoke(jti: string | undefined, exp: number | undefined): Promise<void> {
    if (!jti) return;
    const ttlSegundos = Math.ceil((exp ?? 0) - Date.now() / 1000);
    if (ttlSegundos <= 0) return;
    try {
      await this.redis.set(this.key(jti), "1", "EX", ttlSegundos);
    } catch (err) {
      // Um Redis fora do ar não pode impedir o usuário de sair; o cookie é
      // apagado de qualquer forma e o token morre em 15 minutos.
      this.logger.error(`Falha ao revogar sessão ${jti}: ${(err as Error).message}`);
    }
  }

  async isRevoked(jti: string | undefined): Promise<boolean> {
    if (!jti) return false;
    try {
      return (await this.redis.exists(this.key(jti))) === 1;
    } catch (err) {
      // Falha fechada: se não dá para consultar a lista, não dá para afirmar
      // que a sessão continua válida.
      this.logger.error(`Falha ao consultar revogação de ${jti}: ${(err as Error).message}`);
      return true;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
