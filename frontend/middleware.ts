import { NextRequest, NextResponse } from "next/server";
import { montarCsp } from "./lib/csp";

/**
 * Gera um nonce novo a cada requisição e o publica no CSP (card #71).
 *
 * O Next lê o nonce do cabeçalho CSP da *requisição* e o aplica sozinho aos
 * scripts dele; o `x-nonce` serve ao nosso script inline de branding (ver
 * app/layout.tsx). O nonce precisa ser imprevisível e diferente a cada
 * resposta — por isso as páginas deixam de ser estáticas: uma página
 * prerenderizada congelaria o nonce do build, e a proteção viraria enfeite.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = montarCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Só documentos: estáticos e imagens não executam script e não precisam
      // de nonce. Prefetch do router também fica de fora (não é documento).
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
