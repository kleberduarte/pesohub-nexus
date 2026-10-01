jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => {
    const dados = new Map<string, string>();
    return {
      get: jest.fn(async (k: string) => dados.get(k) ?? null),
      set: jest.fn(async (k: string, v: string) => {
        dados.set(k, v);
        return "OK";
      }),
      del: jest.fn(async (k: string) => (dados.delete(k) ? 1 : 0)),
      exists: jest.fn(async (k: string) => (dados.has(k) ? 1 : 0)),
      quit: jest.fn(),
    };
  });
});

import { SessionRevocationService } from "./session-revocation.service";

/**
 * Card #78 — refreshes concorrentes derrubavam a própria sessão com
 * "conta acessada em outro dispositivo". A rotação passou a ter tolerância, e
 * só o login revoga como outro dispositivo.
 */
describe("SessionRevocationService", () => {
  const exp = () => Math.floor(Date.now() / 1000) + 900;

  afterEach(() => jest.useRealTimers());

  it("login em outro lugar revoga a sessão anterior na hora, como outro_dispositivo", async () => {
    const s = new SessionRevocationService();
    await s.registrarSessaoAtiva("u1", "jti-a", exp());
    await s.registrarSessaoAtiva("u1", "jti-b", exp());
    expect(await s.motivoRevogacao("jti-a")).toBe("outro_dispositivo");
  });

  it("refreshes em paralelo não derrubam a sessão durante a tolerância", async () => {
    const s = new SessionRevocationService();
    const tol = SessionRevocationService.TOLERANCIA_ROTACAO_SEGUNDOS;
    await s.registrarSessaoAtiva("u1", "jti-a1", exp());

    // Refresh A e refresh B chegam os dois com jti-a1.
    await s.revoke("jti-a1", exp(), "troca_de_escopo", tol);
    await s.registrarSessaoAtiva("u1", "jti-a2", exp(), "troca_de_escopo", tol);
    await s.revoke("jti-a1", exp(), "troca_de_escopo", tol);
    await s.registrarSessaoAtiva("u1", "jti-b2", exp(), "troca_de_escopo", tol);

    // O cookie pode ter ficado com qualquer um dos dois.
    expect(await s.motivoRevogacao("jti-a2")).toBeNull();
    expect(await s.motivoRevogacao("jti-b2")).toBeNull();
    expect(await s.motivoRevogacao("jti-a1")).toBeNull();
  });

  it("passada a tolerância, o token rotacionado deixa de valer e nunca como outro_dispositivo", async () => {
    jest.useFakeTimers({ now: Date.now() });
    const s = new SessionRevocationService();
    const tol = SessionRevocationService.TOLERANCIA_ROTACAO_SEGUNDOS;
    await s.registrarSessaoAtiva("u1", "jti-a1", exp());
    await s.registrarSessaoAtiva("u1", "jti-a2", exp(), "troca_de_escopo", tol);

    jest.setSystemTime(Date.now() + (tol + 1) * 1000);
    expect(await s.motivoRevogacao("jti-a1")).toBe("troca_de_escopo");
  });
});
