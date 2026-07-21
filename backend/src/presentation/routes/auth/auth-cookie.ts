import { CookieOptions, Response } from "express";

export const AUTH_COOKIE_NAME = "pesohub_session";
const MAX_AGE_MS = 15 * 60 * 1000; // mantém o mesmo TTL do accessToken (15m)

function cookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    // SameSite=None é necessário enquanto frontend (Vercel) e backend (Railway)
    // vivem em domínios diferentes — "Strict"/"Lax" fariam o browser descartar
    // o cookie em toda chamada cross-site. Exige Secure=true (só em produção,
    // que sempre roda atrás de HTTPS). A proteção contra CSRF que o SameSite
    // dava passa a ser feita pelo allowlist de Origin em main.ts. Quando
    // app.* e api.* passarem a viver sob o mesmo domínio raiz, "strict" volta
    // a ser seguro e pode substituir isso.
    sameSite: isProduction ? "none" : "strict",
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
