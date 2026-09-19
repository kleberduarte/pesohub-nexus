import { decidirAcessoPorDominio } from "./acesso-por-dominio";

/**
 * Card #96 — funcionário de supermercado (@davo.com.br) cadastrado na empresa
 * Ramuza. O que está em jogo é um supermercado enxergar o outro.
 */
describe("decidirAcessoPorDominio", () => {
  const lojas = [
    { id: "davo-mooca", dominioEmail: "davo.com.br" },
    { id: "davo-tatuape", dominioEmail: "davo.com.br" },
    { id: "avo-centro", dominioEmail: "redeavo.com.br" },
    { id: "loja-sem-dominio", dominioEmail: null },
  ];
  const base = { dominioEmpresa: "ramuza.com.br", nomeEmpresa: "Ramuza", lojas };

  it("e-mail da empresa segue a regra de sempre, inclusive Administrador", () => {
    expect(decidirAcessoPorDominio({ ...base, email: "ana@ramuza.com.br", role: "ADMIN" })).toEqual({
      tipo: "empresa",
    });
  });

  it("e-mail de rede sem loja escolhida enxerga a rede inteira, e só ela", () => {
    expect(decidirAcessoPorDominio({ ...base, email: "joao@davo.com.br", role: "OPERADOR" })).toEqual({
      tipo: "rede",
      dominio: "davo.com.br",
      lojaIds: ["davo-mooca", "davo-tatuape"],
    });
  });

  it("e-mail de rede pode ser restrito a uma unidade da própria rede", () => {
    expect(
      decidirAcessoPorDominio({ ...base, email: "joao@davo.com.br", role: "VIEWER", lojaId: "davo-mooca" }),
    ).toEqual({ tipo: "rede", dominio: "davo.com.br", lojaIds: ["davo-mooca"] });
  });

  it("e-mail de rede nunca aponta para loja de outro supermercado", () => {
    const r = decidirAcessoPorDominio({ ...base, email: "joao@davo.com.br", role: "OPERADOR", lojaId: "avo-centro" });
    expect(r.tipo).toBe("recusado");
  });

  it("e-mail de rede nunca é Administrador", () => {
    expect(decidirAcessoPorDominio({ ...base, email: "joao@davo.com.br", role: "ADMIN" }).tipo).toBe("recusado");
    expect(decidirAcessoPorDominio({ ...base, email: "joao@davo.com.br", role: "SUPERADMIN" }).tipo).toBe(
      "recusado",
    );
  });

  it("domínio que nenhuma loja declarou é recusado, com a orientação do que fazer", () => {
    const r = decidirAcessoPorDominio({ ...base, email: "x@gmail.com", role: "OPERADOR" });
    expect(r).toMatchObject({ tipo: "recusado" });
    expect(r.tipo === "recusado" && r.erro).toMatch(/cadastre esse domínio na loja/);
  });

  it("compara domínio sem diferenciar maiúsculas", () => {
    const r = decidirAcessoPorDominio({
      ...base,
      lojas: [{ id: "l1", dominioEmail: " Davo.COM.br " }],
      email: "Joao@DAVO.com.br",
      role: "OPERADOR",
    });
    expect(r).toMatchObject({ tipo: "rede", lojaIds: ["l1"] });
  });

  describe("Administrador da loja (ADMIN_REDE)", () => {
    it("com e-mail de rede, administra a rede inteira", () => {
      expect(decidirAcessoPorDominio({ ...base, email: "gerente@davo.com.br", role: "ADMIN_REDE" })).toEqual({
        tipo: "rede",
        dominio: "davo.com.br",
        lojaIds: ["davo-mooca", "davo-tatuape"],
      });
    });

    it("não pode ser preso a uma só unidade", () => {
      expect(
        decidirAcessoPorDominio({ ...base, email: "gerente@davo.com.br", role: "ADMIN_REDE", lojaId: "davo-mooca" })
          .tipo,
      ).toBe("recusado");
    });

    it("não existe para e-mail da própria empresa", () => {
      expect(decidirAcessoPorDominio({ ...base, email: "ana@ramuza.com.br", role: "ADMIN_REDE" }).tipo).toBe(
        "recusado",
      );
    });
  });
});
