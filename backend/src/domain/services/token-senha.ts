import { createHash, randomBytes } from "crypto";

/**
 * Tokens de link de senha (redefinição #90, convite #91).
 *
 * O token viaja no e-mail; no banco fica só o SHA-256. SHA-256 sem sal basta
 * aqui (ao contrário de senha): o token tem 256 bits de CSPRNG, então não há
 * dicionário a atacar — o hash só impede que quem leia o banco use um link.
 */
export function gerarTokenSenha(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashTokenSenha(token) };
}

export function hashTokenSenha(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Validade do link de "esqueci minha senha". Curta: é credencial em e-mail. */
export const VALIDADE_REDEFINICAO_MINUTOS = 60;
