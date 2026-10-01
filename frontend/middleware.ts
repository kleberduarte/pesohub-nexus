import { NextResponse, type NextRequest } from "next/server";

/**
 * Gating de sessão no servidor: sem o cookie de sessão, nem pinta a tela —
 * redireciona direto para /login (e volta para a rota pedida depois).
 *
 * Só funciona quando o cookie `pesohub_session` chega ao frontend, ou seja,
 * quando frontend e backend estão sob o mesmo domínio raiz (app.* e api.*
 * com COOKIE_DOMAIN no backend — ver backend/.../auth-cookie.ts) ou no dev
 * local (tudo em localhost). Com os domínios separados (Vercel x Railway) o
 * cookie nunca chega aqui e este middleware bloquearia todo mundo — por isso
 * fica desligado até SESSION_MIDDLEWARE_ENABLED=true.
 *
 * Isto é UX, não segurança: só olha se o cookie existe, não valida o JWT.
 * Quem autoriza de verdade continua sendo a API (401).
 */
const SESSION_COOKIE = "pesohub_session";

/** Rotas que precisam abrir sem sessão. */
const ROTAS_PUBLICAS = ["/login", "/acesso/"];

export function middleware(request: NextRequest) {
  if (process.env.SESSION_MIDDLEWARE_ENABLED !== "true") return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (ROTAS_PUBLICAS.some((rota) => pathname === rota || pathname.startsWith(rota))) {
    return NextResponse.next();
  }
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Fora: assets do Next e arquivos estáticos de /public (qualquer coisa com extensão).
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
