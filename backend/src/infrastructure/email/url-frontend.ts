import { ConfigService } from "@nestjs/config";

/**
 * Endereço do frontend usado nos links enviados por e-mail (redefinição de
 * senha #90, convite #91). FRONTEND_URL, ou o primeiro CORS_ORIGIN — que em
 * produção já é o endereço do frontend.
 */
export function resolverUrlFrontend(config: ConfigService): string {
  const cors = (config.get<string>("CORS_ORIGIN") ?? "").split(",")[0]?.trim();
  return (config.get<string>("FRONTEND_URL") || cors || "http://localhost:3001").replace(/\/+$/, "");
}
