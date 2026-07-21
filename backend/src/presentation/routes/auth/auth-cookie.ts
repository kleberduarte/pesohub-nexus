import { CookieOptions, Response } from "express";

export const AUTH_COOKIE_NAME = "pesohub_session";
const MAX_AGE_MS = 15 * 60 * 1000; // mantém o mesmo TTL do accessToken (15m)

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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
