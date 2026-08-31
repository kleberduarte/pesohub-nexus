import { buildPluRow, encodePrice, encodeTara } from "./scale-client";

describe("encodePrice", () => {
  it("codifica valores confirmados por captura A/B do software oficial", () => {
    expect(encodePrice(1.11)).toBe("111,2");
    expect(encodePrice(1.5)).toBe("15,1");
    expect(encodePrice(5.0)).toBe("5,0");
  });

  it("remove zeros à direita reduzindo as casas decimais", () => {
    expect(encodePrice(25.9)).toBe("259,1");
    expect(encodePrice(10.0)).toBe("10,0");
  });

  it("mantém duas casas quando necessário", () => {
    expect(encodePrice(19.99)).toBe("1999,2");
  });

  it("codifica o desconto confirmado via captura Wireshark do software oficial (2026-08-26: '222,2' no campo 56)", () => {
    expect(encodePrice(2.22)).toBe("222,2");
  });
});

describe("encodeTara", () => {
  it("codifica um valor equivalente ao confirmado empiricamente contra a balança física (2026-08-25: '550,2' -> tela mostrou TARA=5.500kg)", () => {
    expect(encodeTara(5.5)).toBe("55,1");
  });

  it("mantém três casas quando necessário", () => {
    expect(encodeTara(1.234)).toBe("1234,3");
  });

  it("remove zeros à direita reduzindo as casas decimais", () => {
    expect(encodeTara(2.0)).toBe("2,0");
  });
});

describe("buildPluRow e os ingredientes", () => {
  const IDX_TEXTO_EXTRA_4 = 19;

  const produto = (textoExtra4?: string | null) =>
    ({
      codigo: "700",
      codigoBarras: "1234567890123",
      nome: "IOGURTE",
      preco: 9.9,
      textoExtra4,
      tabelaNutricional: {
        numero: 40,
        nome: "IOGURTE TESTE",
        ingredientes: "Leite pasteurizado, fermento lacteo, acucar.",
        selos: [],
        itens: [],
      },
    }) as any;

  const campo = (linha: string, idx: number) => linha.split("\t")[idx];

  it("copia os ingredientes para o Texto extra 4 quando o campo vem nulo", () => {
    const linha = buildPluRow(produto(null), 700);
    expect(campo(linha, IDX_TEXTO_EXTRA_4)).toContain("Leite pasteurizado");
  });

  // O formulário do frontend manda "" para todo campo opcional não preenchido.
  // Com a checagem antiga (`== null`) isso bloqueava a cópia e a etiqueta saía
  // sem ingredientes, mesmo com a tabela nutricional preenchida.
  it("copia os ingredientes quando o Texto extra 4 vem em branco", () => {
    expect(campo(buildPluRow(produto(""), 700), IDX_TEXTO_EXTRA_4)).toContain("Leite pasteurizado");
    expect(campo(buildPluRow(produto("   "), 700), IDX_TEXTO_EXTRA_4)).toContain("Leite pasteurizado");
  });

  it("preserva um Texto extra 4 que o usuário preencheu", () => {
    const linha = buildPluRow(produto("Consumir gelado"), 700);
    expect(campo(linha, IDX_TEXTO_EXTRA_4)).toBe("Consumir gelado");
  });
});
