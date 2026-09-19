import {
  bloqueiaPorAtraso,
  calcularCobranca,
  competenciaDe,
  fimDaCompetencia,
  vencimentoDaCompetencia,
} from "./precificacao";

describe("calcularCobranca", () => {
  // Contrato da fabricante: R$ 40 por balança, mínimo 400.
  it("piso comercial: abaixo do mínimo cobra o mínimo", () => {
    expect(calcularCobranca(120, 40, 400)).toMatchObject({ quantidadeFaturada: 400, valorTotal: 16000 });
  });

  it("no mínimo exato: 400 x R$ 40 = R$ 16.000", () => {
    expect(calcularCobranca(400, 40, 400).valorTotal).toBe(16000);
  });

  it("acima do mínimo, cresce com o volume", () => {
    expect(calcularCobranca(650, 40, 400).valorTotal).toBe(26000);
    expect(calcularCobranca(1000, 40, 400).valorTotal).toBe(40000);
  });

  it("cliente final: mínimo 1 balança", () => {
    expect(calcularCobranca(3, 40, 1).valorTotal).toBe(120);
    expect(calcularCobranca(0, 40, 1)).toMatchObject({ quantidadeFaturada: 1, valorTotal: 40 });
  });

  it("não soma dinheiro em ponto flutuante", () => {
    expect(calcularCobranca(3, 39.9, 1).valorTotal).toBe(119.7);
  });

  it("recusa entrada inválida em vez de cobrar errado", () => {
    expect(() => calcularCobranca(-1, 40, 1)).toThrow();
    expect(() => calcularCobranca(1, 0, 1)).toThrow();
    expect(() => calcularCobranca(1.5, 40, 1)).toThrow();
  });
});

describe("competência", () => {
  it("formata AAAA-MM", () => {
    expect(competenciaDe(new Date("2026-09-19T23:00:00Z"))).toBe("2026-09");
  });

  it("o corte da apuração é a virada do mês", () => {
    expect(fimDaCompetencia("2026-09").toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("vence no dia combinado do mês seguinte", () => {
    expect(vencimentoDaCompetencia("2026-09", 10).toISOString()).toBe("2026-10-10T00:00:00.000Z");
  });

  it("dia que não existe no mês cai no último dia", () => {
    expect(vencimentoDaCompetencia("2026-01", 31).toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });

  it("recusa competência inválida", () => {
    expect(() => fimDaCompetencia("2026-13")).toThrow();
  });
});

describe("bloqueiaPorAtraso", () => {
  const venceu = new Date("2026-09-10T00:00:00Z");

  it("dentro da carência, não bloqueia", () => {
    expect(bloqueiaPorAtraso(venceu, 7, new Date("2026-09-16T23:00:00Z"))).toBe(false);
  });

  it("passada a carência, bloqueia", () => {
    expect(bloqueiaPorAtraso(venceu, 7, new Date("2026-09-18T00:00:00Z"))).toBe(true);
  });

  it("sem vencimento conhecido, não bloqueia ninguém", () => {
    expect(bloqueiaPorAtraso(null, 7, new Date())).toBe(false);
  });
});
