import { createServer } from "net";
import type { AddressInfo } from "net";
import {
  buildPluRow,
  descreverFormatosDivergentes,
  encodePrice,
  encodeTara,
  verificarFormatosGravados,
} from "./scale-client";

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

describe("buildSyncBody — formatos avulsos", () => {
  const { buildSyncBody } = require("./scale-client");

  const formato = (numero: number, nome: string) => ({
    numero,
    nome,
    larguraMm: 56,
    alturaMm: 40,
    elementos: [{ tipo: "nome", x: 1, y: 1, largura: 50, altura: 4 }],
  });

  const linhasLab = (corpo: string) =>
    corpo.split("\r\n").filter((l) => l.startsWith("LAB\t"));

  // A regressão que este teste trava: o bloco LAB só existia como efeito
  // colateral dos produtos do pacote, então um layout que nenhum produto usa
  // nunca chegava à balança — e a sincronização mesmo assim dizia sucesso.
  it("grava o layout mesmo sem nenhum produto no pacote", () => {
    const corpo = buildSyncBody([], [formato(23, "SO O LAYOUT")]);
    const labs = linhasLab(corpo);
    expect(labs).toHaveLength(1);
    expect(labs[0].split("\t")[1]).toBe("23");
    expect(corpo).toContain("DWL\tLAB");
    expect(corpo).toContain("END\tLAB");
  });

  it("não duplica um formato que já veio pelo produto", () => {
    const produtos = [
      {
        codigo: "700",
        codigoBarras: "1234567890123",
        nome: "IOGURTE",
        preco: 9.9,
        formatoImpressao: formato(22, "PELO PRODUTO"),
      },
    ] as any;
    const corpo = buildSyncBody(produtos, [formato(22, "AVULSO")]);
    const labs = linhasLab(corpo);
    expect(labs).toHaveLength(1);
    // O do produto vence: é ele que carrega o vínculo com o bitmap de selos.
    expect(labs[0]).toContain("PELO PRODUTO");
  });
});

/**
 * Detecção de descarte silencioso (card #54).
 *
 * A balança aceita e descarta a gravação de um LAB cujo número caia num slot
 * de fábrica. ACK não prova nada — só a releitura prova. Estes testes cobrem
 * os quatro desfechos, incluindo o que mais engana: leitura que FALHA não pode
 * ser lida como "slot vazio".
 */
describe("verificarFormatosGravados", () => {
  const formato = (numero: number, nome: string) => ({
    numero,
    nome,
    larguraMm: 58,
    alturaMm: 40,
    elementos: [],
  });

  /** Sobe uma balança de mentira que responde UPL/LAB conforme `slots`. */
  function balancaFake(slots: Record<number, string | null>, opcoes: { derruba?: boolean } = {}) {
    const servidor = createServer((socket) => {
      if (opcoes.derruba) {
        socket.destroy();
        return;
      }
      socket.setEncoding("latin1");
      socket.on("data", (chunk: string) => {
        const m = /UPL\tLAB\t(\d+)\t/.exec(chunk);
        if (!m) return;
        const numero = Number(m[1]);
        const nome = slots[numero];
        const linha = nome != null ? `LAB\t${numero}\t${nome}\t0\t58\t40\t\r\n` : "";
        socket.write(`${linha}END\tLAB\t\r\n`, "latin1");
      });
    });
    return new Promise<{ porta: number; fechar: () => void }>((resolve) => {
      servidor.listen(0, "127.0.0.1", () => {
        const addr = servidor.address() as AddressInfo;
        resolve({ porta: addr.port, fechar: () => servidor.close() });
      });
    });
  }

  it("não acusa divergência quando o nome gravado bate com o enviado", async () => {
    const b = await balancaFake({ 23: "Etiqueta 60x80" });
    const r = await verificarFormatosGravados("127.0.0.1", b.porta, [formato(23, "Etiqueta 60x80")]);
    b.fechar();
    expect(r).toEqual({ ok: true, divergentes: [] });
  });

  it("acusa o slot que continua com um modelo de fábrica", async () => {
    const b = await balancaFake({ 1: "PF-1" });
    const r = await verificarFormatosGravados("127.0.0.1", b.porta, [formato(1, "Minha Etiqueta")]);
    b.fechar();
    expect(r).toEqual({
      ok: true,
      divergentes: [{ numero: 1, esperado: "Minha Etiqueta", encontrado: "PF-1" }],
    });
  });

  it("acusa o slot que voltou vazio", async () => {
    const b = await balancaFake({});
    const r = await verificarFormatosGravados("127.0.0.1", b.porta, [formato(40, "Avulso")]);
    b.fechar();
    expect(r).toEqual({
      ok: true,
      divergentes: [{ numero: 40, esperado: "Avulso", encontrado: null }],
    });
  });

  // O de sempre: em 2026-09-01 uma leitura que falhou foi lida como "0 PLUs" e
  // gerou alarme falso de balança zerada. Falha de leitura NÃO é slot vazio.
  it("reporta erro quando a leitura falha, em vez de concluir que o slot está vazio", async () => {
    const b = await balancaFake({}, { derruba: true });
    const r = await verificarFormatosGravados("127.0.0.1", b.porta, [formato(23, "Etiqueta")]);
    b.fechar();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toMatch(/Conexão encerrada|Falha ao reler|recusou a conexão/);
  });
});

describe("descreverFormatosDivergentes", () => {
  it("explica o slot ocupado e sugere trocar o número", () => {
    const msg = descreverFormatosDivergentes([
      { numero: 1, esperado: "Minha Etiqueta", encontrado: "PF-1" },
    ]);
    expect(msg).toContain('formato 1 ("Minha Etiqueta") não foi gravado');
    expect(msg).toContain('ainda contém "PF-1"');
    expect(msg).toContain("modelo de fábrica");
    expect(msg).toContain("Escolha outro número");
  });

  it("distingue slot vazio de slot ocupado", () => {
    const msg = descreverFormatosDivergentes([
      { numero: 40, esperado: "Avulso", encontrado: null },
    ]);
    expect(msg).toContain("o slot está vazio");
  });
});
