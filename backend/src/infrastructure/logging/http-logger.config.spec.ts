import { createServer } from "http";
import type { AddressInfo } from "net";
import pino from "pino";
import pinoHttp from "pino-http";
import { Writable } from "stream";
import { criarOpcoesHttpLogger, mascararUrl } from "./http-logger.config";

/**
 * Card #80 — o JWT da sessão (cookie) e o token do link público iam inteiros
 * para os logs de produção. Testa a saída real do logger, não a configuração.
 */
describe("logger HTTP", () => {
  const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSJ9.assinatura-secreta";
  const TOKEN_PUBLICO = "cmssbi8ka0001o501b6mujgqi";

  async function logarRequisicao(path: string): Promise<string> {
    let saida = "";
    const destino = new Writable({
      write(chunk, _enc, cb) {
        saida += chunk.toString();
        cb();
      },
    });
    const opcoes = { ...criarOpcoesHttpLogger(), transport: undefined };
    const logger = pinoHttp({ ...opcoes, logger: pino({ redact: opcoes.redact }, destino) });

    const server = createServer((req, res) => {
      logger(req, res);
      res.setHeader("set-cookie", `pesohub_session=${JWT}; HttpOnly`);
      res.end("ok");
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const { port } = server.address() as AddressInfo;
    await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: { cookie: `pesohub_session=${JWT}`, authorization: `Bearer ${JWT}` },
    });
    await new Promise((r) => server.close(r));
    return saida;
  }

  it("não grava o cookie de sessão, o set-cookie nem o authorization", async () => {
    const saida = await logarRequisicao("/api/v1/auth/refresh");
    expect(saida).toContain("request completed");
    expect(saida).not.toContain(JWT);
    expect(saida).not.toContain("assinatura-secreta");
    expect(saida).toContain("[oculto]");
  });

  it("não grava o token do link público que vem na URL", async () => {
    const saida = await logarRequisicao(`/api/v1/clientes/acesso/${TOKEN_PUBLICO}`);
    expect(saida).toContain("/api/v1/clientes/acesso/[oculto]");
    expect(saida).not.toContain(TOKEN_PUBLICO);
  });

  it("mantém as demais URLs intactas", () => {
    expect(mascararUrl("/api/v1/devices?page=2")).toBe("/api/v1/devices?page=2");
  });
});
