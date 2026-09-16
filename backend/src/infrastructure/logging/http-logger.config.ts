import type { Options } from "pino-http";

/**
 * O que nunca pode chegar aos logs (card #80).
 *
 * A sessão vive num cookie httpOnly, não no Authorization — e só o
 * Authorization era ocultado. Resultado: cada requisição gravava o JWT inteiro
 * nos logs do Railway, e qualquer um com acesso ao painel (ou a um print dele)
 * entrava como o usuário. O `set-cookie` do login/refresh vazava o token novo.
 */
export const CAMPOS_OCULTOS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
];

/**
 * O token do link público (`/clientes/acesso/:token`) é um segredo: quem tem o
 * link vê a identidade da empresa sem login. Ele vem na URL, então o redact
 * por caminho não alcança — mascaramos a própria URL e os params.
 */
const ROTAS_COM_SEGREDO_NA_URL = /^(\/api\/v1\/clientes\/acesso\/)[^/?#]+/;

export function mascararUrl(url: string | undefined): string | undefined {
  return url?.replace(ROTAS_COM_SEGREDO_NA_URL, "$1[oculto]");
}

export function criarOpcoesHttpLogger(): Options {
  return {
    level: process.env.LOG_LEVEL ?? "info",
    transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
    redact: { paths: CAMPOS_OCULTOS, censor: "[oculto]" },
    autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
    serializers: {
      req(req: { url?: string; params?: Record<string, unknown> } & Record<string, unknown>) {
        const url = mascararUrl(req.url);
        if (url === req.url) return req;
        return { ...req, url, params: { oculto: true } };
      },
    },
  };
}
