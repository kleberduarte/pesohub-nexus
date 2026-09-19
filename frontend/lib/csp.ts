// Sem NEXT_PUBLIC_API_URL definido, a página chama a API no mesmo hostname
// que a serviu (ver lib/api.ts) — então o CSP precisa liberar connect-src
// tanto para localhost quanto 127.0.0.1, já que o navegador pode acessar o
// frontend por qualquer um dos dois (a resolução de "localhost" para portas
// do Docker é intermitente nesta máquina de dev).
function apiOrigins(): string {
  if (!process.env.NEXT_PUBLIC_API_URL) return "http://localhost:3000 http://127.0.0.1:3000";
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL).origin;
  } catch {
    return "";
  }
}

/**
 * Content-Security-Policy com nonce por requisição (card #71).
 *
 * Antes o script-src tinha 'unsafe-inline', o que anula a proteção contra XSS:
 * qualquer <script> injetado rodava. Um XSS não rouba a sessão (cookie
 * httpOnly), mas age como o usuário logado — para um ADMIN, controle total da
 * empresa. Agora só roda script com o nonce desta resposta; 'strict-dynamic'
 * estende a confiança aos chunks que esses scripts carregam.
 *
 * 'unsafe-eval' só em dev: o Fast Refresh do webpack usa eval() para o HMR.
 * style-src segue com 'unsafe-inline': o Next injeta estilos inline, e estilo
 * não executa código — o risco que importa aqui é script.
 */
export function montarCsp(nonce: string): string {
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    `connect-src 'self' ${apiOrigins()}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
