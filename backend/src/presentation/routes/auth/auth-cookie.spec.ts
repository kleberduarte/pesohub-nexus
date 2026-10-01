import { Response } from "express";
import { AUTH_COOKIE_NAME, clearAuthCookie, setAuthCookie } from "./auth-cookie";

/**
 * Unificação de domínio (app.* / api.* sob o mesmo domínio raiz).
 *
 * O SameSite do cookie de sessão depende de COOKIE_DOMAIN: sem ele, em
 * produção, frontend e backend ainda são sites diferentes e só None funciona;
 * com ele, Lax volta a ser seguro. O deploy do código não pode quebrar o login
 * antes de o DNS ser migrado — por isso a troca é guiada pela env.
 */
describe("auth-cookie", () => {
  const envOriginal = { ...process.env };

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  function opcoesDoSet() {
    const res = { cookie: jest.fn() } as unknown as Response;
    setAuthCookie(res, "token");
    const [nome, valor, opcoes] = (res.cookie as jest.Mock).mock.calls[0];
    expect(nome).toBe(AUTH_COOKIE_NAME);
    expect(valor).toBe("token");
    return opcoes;
  }

  it("produção sem COOKIE_DOMAIN mantém SameSite=None e cookie host-only", () => {
    process.env.NODE_ENV = "production";
    delete process.env.COOKIE_DOMAIN;
    expect(opcoesDoSet()).toMatchObject({ sameSite: "none", secure: true, httpOnly: true, domain: undefined });
  });

  it("produção com COOKIE_DOMAIN usa Lax e o domínio compartilhado", () => {
    process.env.NODE_ENV = "production";
    process.env.COOKIE_DOMAIN = ".pesohub.com.br";
    expect(opcoesDoSet()).toMatchObject({ sameSite: "lax", secure: true, httpOnly: true, domain: ".pesohub.com.br" });
  });

  it("dev continua Strict e host-only", () => {
    process.env.NODE_ENV = "development";
    delete process.env.COOKIE_DOMAIN;
    expect(opcoesDoSet()).toMatchObject({ sameSite: "strict", secure: false, domain: undefined });
  });

  it("logout limpa o cookie com o mesmo domínio em que foi setado", () => {
    process.env.NODE_ENV = "production";
    process.env.COOKIE_DOMAIN = ".pesohub.com.br";
    const res = { clearCookie: jest.fn() } as unknown as Response;
    clearAuthCookie(res);
    expect((res.clearCookie as jest.Mock).mock.calls[0][1]).toMatchObject({ domain: ".pesohub.com.br", sameSite: "lax" });
  });
});
