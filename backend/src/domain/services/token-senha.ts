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

/**
 * Validade do convite. Mais longa que a redefinição: quem é convidado nem
 * sempre abre o e-mail no mesmo dia, e o administrador pode reenviar.
 */
export const VALIDADE_CONVITE_DIAS = 7;

export type StatusConvite = "pendente" | "expirado" | "cancelado";

/**
 * Situação do convite de um usuário, a partir do convite mais recente.
 *
 * Sem coluna nova: um convite aceito é queimado no mesmo instante em que a
 * senha é gravada, então `passwordChangedAt >= usadoEm`. Queimado sem senha
 * nova depois dele = cancelado pelo administrador. Nulo = conta normal.
 */
export function statusConvite(
  convite: { usadoEm: Date | null; expiraEm: Date } | undefined,
  passwordChangedAt: Date | null,
  agora = new Date(),
): StatusConvite | null {
  if (!convite) return null;
  if (!convite.usadoEm) return convite.expiraEm > agora ? "pendente" : "expirado";
  if (passwordChangedAt && passwordChangedAt >= convite.usadoEm) return null;
  return "cancelado";
}
