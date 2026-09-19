import type { NextConfig } from "next";

// O Content-Security-Policy NÃO mora aqui: precisa de um nonce novo por
// requisição, então é montado no middleware.ts (ver lib/csp.ts, card #71).
// Dois cabeçalhos CSP se somam no navegador — manter um estático aqui
// reintroduziria o 'unsafe-inline' que o nonce veio eliminar.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ignorado por browsers em conexões HTTP (dev); efetivo em produção via HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
