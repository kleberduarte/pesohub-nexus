import { createHash, randomBytes } from "crypto";

/**
 * O token do Agent Local é a única credencial que autentica a conexão WebSocket
 * de um agente e escopa o tenant dele. Guardá-lo em texto puro significa que um
 * dump do banco (backup vazado, acesso de leitura indevido) entrega acesso
 * direto a todas as balanças de todos os clientes. O banco passa a guardar
 * apenas o hash; o valor real só existe na resposta de criação e no
 * AGENT_TOKEN do .env do agente.
 *
 * SHA-256 puro, e não bcrypt/argon2, é a escolha certa aqui: o token tem 24
 * bytes de entropia de CSPRNG (não é senha escolhida por humano, então não há
 * o que um hash lento proteja contra), e a autenticação precisa de uma busca
 * indexada por igualdade, que só um hash determinístico permite.
 */
export function generateAgentToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashAgentToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
