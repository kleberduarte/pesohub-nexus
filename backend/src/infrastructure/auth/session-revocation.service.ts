import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { getRedisUrl } from "../queue/redis-connection";

/**
 * Motivo pelo qual uma sessão deixou de valer. O guard usa isso para dizer ao
 * usuário o que aconteceu — "sua conta foi acessada em outro dispositivo" é
 * uma informação de segurança, não um detalhe de implementação: é assim que a
 * pessoa descobre que alguém está usando a conta dela.
 */
export type MotivoRevogacao = "logout" | "outro_dispositivo" | "inatividade" | "troca_de_escopo";

export const MENSAGEM_POR_MOTIVO: Record<MotivoRevogacao, string> = {
  logout: "Sessão encerrada. Faça login novamente.",
  outro_dispositivo: "Sua sessão foi encerrada porque sua conta foi acessada em outro dispositivo.",
  inatividade: "Sua sessão expirou por inatividade. Faça login novamente.",
  troca_de_escopo: "Sessão encerrada. Faça login novamente.",
};

/**
 * Controle de sessões, em Redis.
 *
 * Três responsabilidades, todas em cima do `jti` que o AuthService põe no JWT:
 *
 * 1. **Revogação** — o access token é um JWT auto-contido: até então, sair da
 *    sessão apenas apagava o cookie do navegador, e um token já copiado
 *    (extensão maliciosa, XSS num subdomínio, máquina compartilhada de loja)
 *    continuava valendo até expirar. O logout registra o `jti` aqui e o
 *    JwtAuthGuard recusa qualquer token cujo `jti` esteja na lista.
 *
 * 2. **Sessão única por usuário** (card #48) — `session:active:<userId>` guarda
 *    o `jti` da única sessão válida. Entrar em outro lugar revoga a anterior,
 *    com motivo `outro_dispositivo`. Era o cenário real da Ramuza: várias
 *    pessoas na mesma conta, se empurrando entre lojas sem perceber.
 *
 * 3. **Timeout por inatividade** — `session:seen:<jti>` é uma chave que expira
 *    sozinha e é renovada a cada requisição autenticada. Sumiu a chave, a
 *    sessão morreu por inatividade, mesmo que o JWT ainda não tenha expirado.
 *    É o modelo de banco: quem está trabalhando não é deslogado; quem largou a
 *    tela aberta é.
 *
 * As entradas expiram sozinhas, então nada cresce sem limite. Fica no mesmo
 * Redis do throttler e da fila, e por isso vale para todas as instâncias do
 * backend.
 */
@Injectable()
export class SessionRevocationService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionRevocationService.name);
  private readonly redis = new Redis(getRedisUrl());

  /**
   * Janela de inatividade. Dentro do intervalo de 5–10 min que os bancos usam;
   * 10 é o teto porque uma balconista atendendo cliente fica minutos sem tocar
   * na tela e não pode cair no meio do atendimento.
   */
  static readonly INATIVIDADE_SEGUNDOS = 10 * 60;

  private keyRevogada(jti: string): string {
    return `session:revoked:${jti}`;
  }

  private keyAtiva(userId: string): string {
    return `session:active:${userId}`;
  }

  private keyVista(jti: string): string {
    return `session:seen:${jti}`;
  }

  /**
   * @param exp `exp` do JWT, em segundos desde a época — define por quanto
   * tempo a entrada precisa sobreviver. Depois disso o próprio token expira.
   */
  async revoke(
    jti: string | undefined,
    exp: number | undefined,
    motivo: MotivoRevogacao = "logout",
  ): Promise<void> {
    if (!jti) return;
    const ttlSegundos = Math.ceil((exp ?? 0) - Date.now() / 1000);
    if (ttlSegundos <= 0) return;
    try {
      await this.redis.set(this.keyRevogada(jti), motivo, "EX", ttlSegundos);
      await this.redis.del(this.keyVista(jti));
    } catch (err) {
      // Um Redis fora do ar não pode impedir o usuário de sair; o cookie é
      // apagado de qualquer forma e o token morre sozinho.
      this.logger.error(`Falha ao revogar sessão ${jti}: ${(err as Error).message}`);
    }
  }

  /**
   * Retorna o motivo da revogação, ou null se a sessão segue válida.
   *
   * Falha fechada: se não dá para consultar a lista, não dá para afirmar que a
   * sessão continua válida.
   */
  async motivoRevogacao(jti: string | undefined): Promise<MotivoRevogacao | null> {
    if (!jti) return null;
    try {
      const motivo = await this.redis.get(this.keyRevogada(jti));
      return (motivo as MotivoRevogacao | null) ?? null;
    } catch (err) {
      this.logger.error(`Falha ao consultar revogação de ${jti}: ${(err as Error).message}`);
      return "logout";
    }
  }

  /** Mantido por compatibilidade com o JwtAuthGuard anterior e seus testes. */
  async isRevoked(jti: string | undefined): Promise<boolean> {
    return (await this.motivoRevogacao(jti)) !== null;
  }

  /**
   * Registra `jti` como a sessão ativa do usuário e revoga a anterior, se
   * houver. Chamado no login e sempre que um token novo é emitido.
   *
   * @param expAnterior expiração aproximada da sessão anterior. Não temos o
   * `exp` real dela guardado, então usamos o do token novo: a entrada de
   * revogação sobrevive pelo menos o tempo que o token antigo ainda valeria.
   */
  async registrarSessaoAtiva(
    userId: string,
    jti: string,
    exp: number,
    motivoAnterior: MotivoRevogacao = "outro_dispositivo",
  ): Promise<void> {
    try {
      const anterior = await this.redis.get(this.keyAtiva(userId));
      if (anterior && anterior !== jti) {
        await this.revoke(anterior, exp, motivoAnterior);
      }
      const ttlSegundos = Math.ceil(exp - Date.now() / 1000);
      if (ttlSegundos > 0) {
        await this.redis.set(this.keyAtiva(userId), jti, "EX", ttlSegundos);
      }
      await this.marcarAtividade(jti);
    } catch (err) {
      // Não pode impedir o login: sem Redis o sistema perde a sessão única,
      // mas continua autenticando normalmente.
      this.logger.error(`Falha ao registrar sessão ativa de ${userId}: ${(err as Error).message}`);
    }
  }

  /** Renova a janela de inatividade. Chamado a cada requisição autenticada. */
  async marcarAtividade(jti: string | undefined): Promise<void> {
    if (!jti) return;
    try {
      await this.redis.set(
        this.keyVista(jti),
        "1",
        "EX",
        SessionRevocationService.INATIVIDADE_SEGUNDOS,
      );
    } catch (err) {
      this.logger.error(`Falha ao marcar atividade de ${jti}: ${(err as Error).message}`);
    }
  }

  /**
   * True quando a sessão passou da janela de inatividade.
   *
   * Falha ABERTA, ao contrário da revogação: um Redis fora do ar não pode
   * deslogar a loja inteira por "inatividade" que não aconteceu. A revogação
   * explícita (logout, outro dispositivo) continua falhando fechada, e o JWT
   * tem expiração própria — o risco residual é limitado a essa janela.
   */
  async expirouPorInatividade(jti: string | undefined): Promise<boolean> {
    if (!jti) return false;
    try {
      return (await this.redis.exists(this.keyVista(jti))) === 0;
    } catch (err) {
      this.logger.error(`Falha ao consultar atividade de ${jti}: ${(err as Error).message}`);
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
