import type { NextConfig } from "next";

// Sem NEXT_PUBLIC_API_URL definido, a página chama a API no mesmo hostname
// que a serviu (ver lib/api.ts) — então o CSP precisa liberar connect-src
// tanto para localhost quanto 127.0.0.1, já que o navegador pode acessar o
// frontend por qualquer um dos dois (a resolução de "localhost" para portas
// do Docker é intermitente nesta máquina de dev).
const apiOrigins = process.env.NEXT_PUBLIC_API_URL
  ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_API_URL).origin;
      } catch {
        return "";
      }
    })()
  : "http://localhost:3000 http://127.0.0.1:3000";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ignorado por browsers em conexões HTTP (dev); efetivo em produção via HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' é necessário para os scripts inline que o Next.js App
      // Router injeta pra hidratar a página (payload RSC via self.__next_f.push).
      // Sem nonce/hash isso não dá pra evitar com Server Components + Next 15.
      // 'unsafe-eval' só em dev: o Fast Refresh do webpack (`next dev`) usa eval()
      // para aplicar HMR; sem isso a página trava sem hidratar (nenhum erro visível
      // além de uma EvalError no console). Build de produção não usa eval, então
      // fica de fora do CSP real.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      `connect-src 'self' ${apiOrigins}`.trim(),
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
