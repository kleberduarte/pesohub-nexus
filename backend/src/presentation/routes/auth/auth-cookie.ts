import { CookieOptions, Response } from "express";

export const AUTH_COOKIE_NAME = "pesohub_session";
const MAX_AGE_MS = 15 * 60 * 1000; // mantém o mesmo TTL do accessToken (15m)

function cookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  // Domínio raiz compartilhado por app.* (Vercel) e api.* (Railway), ex.:
  // ".pesohub.com.br". Com ele, frontend e backend são o mesmo *site*: o
  // cookie volta a poder ser Lax e passa a chegar também na Vercel (o que
  // permite gating de sessão no middleware.ts do frontend). Atenção: o
  // cookie vale para TODO subdomínio desse domínio — não hospede conteúdo
  // de terceiros sob ele.
  const domain = process.env.COOKIE_DOMAIN?.trim() || undefined;
  return {
    httpOnly: true,
    secure: isProduction,
    // Sem COOKIE_DOMAIN em produção, frontend e backend ainda vivem em
    // domínios diferentes e SameSite=None é obrigatório — "Strict"/"Lax"
    // fariam o browser descartar o cookie em toda chamada cross-site (a
    // proteção contra CSRF fica só com o allowlist de Origin em main.ts).
    // Com COOKIE_DOMAIN, Lax: bloqueia POST/fetch vindos de outro site (o
    // vetor de CSRF) mas deixa passar a navegação GET de nível superior —
    // com Strict, quem abrisse um link do dashboard vindo de e-mail/WhatsApp
    // chegaria sem cookie e cairia no /login mesmo estando logado.
    sameSite: isProduction && !domain ? "none" : isProduction ? "lax" : "strict",
    domain,
    path: "/",
    maxAge: MAX_AGE_MS,
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}
