import { readFileSync } from "fs";
import { join } from "path";
import { sync as glob } from "glob";
import { JwtAuthGuard } from "./jwt-auth.guard";

/**
 * A superfície pública da API é um inventário, não um detalhe de
 * implementação. Este teste falha quando ela muda — inclusive quando cresce
 * por acidente. Adicionar uma rota pública aqui deve custar uma linha nesta
 * lista e a conversa que vem junto.
 */
const SUPERFICIE_PUBLICA_ESPERADA = [
  // login: é onde a sessão nasce. esqueci-senha e redefinir-senha (card #90):
  // quem as usa por definição não tem sessão; autenticam pelo token do link.
  "auth/auth.controller.ts",
  "billing/billing.controller.ts", // webhook do Asaas: autentica por token no header
  "clientes/clientes-public.controller.ts", // link de acesso: autentica pelo token da URL
  "health/health.controller.ts", // healthcheck do Railway
];

const rotasDir = join(__dirname, "..", "routes");

describe("superfície pública da API", () => {
  it("expõe exatamente os controllers auditados e nenhum outro", () => {
    const comPublic = glob("**/*.controller.ts", { cwd: rotasDir })
      .filter((arquivo) => !arquivo.endsWith(".spec.ts"))
      .filter((arquivo) => readFileSync(join(rotasDir, arquivo), "utf8").includes("@Public()"))
      .map((arquivo) => arquivo.split("\\").join("/"))
      .sort();

    expect(comPublic).toEqual(SUPERFICIE_PUBLICA_ESPERADA);
  });

  it("não deixa nenhum controller declarar o JwtAuthGuard por conta própria", () => {
    // O guard é global. Um `@UseGuards(JwtAuthGuard)` local não protege mais
    // nada — só faz a verificação de sessão e a consulta de billing rodarem
    // duas vezes por requisição.
    const infratores = glob("**/*.controller.ts", { cwd: rotasDir }).filter((arquivo) =>
      readFileSync(join(rotasDir, arquivo), "utf8").includes("UseGuards(JwtAuthGuard"),
    );

    expect(infratores).toEqual([]);
  });
});

describe("JwtAuthGuard e rotas públicas", () => {
  const contexto = (isPublic: boolean) => ({
    switchToHttp: () => ({ getRequest: () => ({ cookies: {}, headers: {} }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
    _isPublic: isPublic,
  });

  const reflector = (valor: boolean) => ({ getAllAndOverride: () => valor }) as never;

  it("libera a requisição sem cookie quando a rota é @Public()", async () => {
    const guard = new JwtAuthGuard({} as never, {} as never, reflector(true), {} as never, {} as never);
    await expect(guard.canActivate(contexto(true) as never)).resolves.toBe(true);
  });

  it("recusa a requisição sem cookie quando a rota não é pública", async () => {
    const guard = new JwtAuthGuard({} as never, {} as never, reflector(false), {} as never, {} as never);
    await expect(guard.canActivate(contexto(false) as never)).rejects.toThrow("Token ausente");
  });
});
