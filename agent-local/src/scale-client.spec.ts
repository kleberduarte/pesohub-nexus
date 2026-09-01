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

/**
 * Borda e Divisória chegaram ao editor para permitir importar os modelos de
 * fábrica da Ramuza (card #52) — 181 dos elementos daqueles layouts são linhas
 * e molduras, que antes simplesmente sumiam.
 *
 * O `Config/pt-BR/LabelItem.xml` oficial documenta que o Flag2 significa
 * coisas DIFERENTES nos dois: em Borda é a espessura (1..15), em Divisória é
 * o comportamento (0=Flag da área, 1=Imprimir página, 2=Imprimir linha).
 * Tratar os dois igual transforma uma linha visível num marcador invisível.
 */
describe("buildSyncBody — Borda e Divisória", () => {
  const { buildSyncBody } = require("./scale-client");

  const comElementos = (elementos: unknown[]) =>
    [
      {
        codigo: "700",
        codigoBarras: "1234567890123",
        nome: "IOGURTE",
        preco: 9.9,
        formatoImpressao: { numero: 22, nome: "TESTE", larguraMm: 58, alturaMm: 79, elementos },
      },
    ] as any;

  const linhasLas = (corpo: string) =>
    corpo
      .split("\r\n")
      .filter((l) => l.startsWith("LAS\t"))
      .map((l) => l.split("\t"));

  it("emite Borda como Flag1=4 com a espessura no Flag2", () => {
    const corpo = buildSyncBody(
      comElementos([{ tipo: "borda", x: 1, y: 5, largura: 55, altura: 0.5, espessura: 15 }]),
    );
    const [las] = linhasLas(corpo);
    expect(las[2]).toBe("4"); // Flag1
    expect(las[3]).toBe("15"); // Flag2 = espessura
  });

  it("usa a espessura padrão quando o elemento não define uma", () => {
    const corpo = buildSyncBody(comElementos([{ tipo: "borda", x: 1, y: 5, largura: 55, altura: 0.5 }]));
    expect(linhasLas(corpo)[0][3]).toBe("2");
  });

  // A regressão que este teste trava: a primeira versão deixava `espessura`
  // sobrescrever o Flag2 também na Divisória, o que trocaria "Imprimir linha"
  // (2) por outro comportamento — provavelmente o marcador invisível.
  it("mantém a Divisória em Imprimir linha mesmo com espessura definida", () => {
    const corpo = buildSyncBody(
      comElementos([{ tipo: "divisoria", x: 1, y: 5, largura: 55, altura: 0.5, espessura: 15 }]),
    );
    const [las] = linhasLas(corpo);
    expect(las[2]).toBe("5"); // Flag1
    expect(las[3]).toBe("2"); // Flag2 = Imprimir linha, NÃO a espessura
  });
});
