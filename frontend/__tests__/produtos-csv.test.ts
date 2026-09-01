import { parseCsv, toCsv } from "../lib/produtos-csv";
import type { Product } from "../lib/api";

/**
 * Importação e exportação de produtos em CSV (card #64).
 *
 * O caminho mais provável de perda de dados em massa do sistema: um CSV mal
 * interpretado cadastra centenas de produtos errados de uma vez, e o erro só
 * aparece na etiqueta impressa.
 */
const produto = (over: Partial<Product> = {}): Product =>
  ({
    id: "p1",
    codigo: "700",
    codigoBarras: "7891000100103",
    nome: "IOGURTE",
    preco: 9.9,
    categoriaImposto: "T",
    ativo: true,
    ...over,
  }) as Product;

describe("parseCsv", () => {
  it("lê as colunas obrigatórias", () => {
    const linhas = parseCsv("codigo,codigoBarras,nome,preco\n700,789,IOGURTE,9.90");
    expect(linhas).toEqual([
      { codigo: "700", codigoBarras: "789", nome: "IOGURTE", preco: 9.9, categoriaImposto: undefined, ativo: true },
    ]);
  });

  it("aceita vírgula como separador decimal do preço", () => {
    expect(parseCsv("codigo,codigoBarras,nome,preco\n700,789,IOGURTE,\"9,90\"")[0].preco).toBe(9.9);
  });

  it("recusa cabeçalho sem as colunas obrigatórias, dizendo quais são", () => {
    expect(() => parseCsv("codigo,nome\n700,IOGURTE")).toThrow(/codigoBarras/);
  });

  it("ignora linhas em branco", () => {
    expect(parseCsv("codigo,codigoBarras,nome,preco\n\n700,789,IOGURTE,9.90\n\n")).toHaveLength(1);
  });

  it("trata ativo=0 como inativo", () => {
    const csv = "codigo,codigoBarras,nome,preco,ativo\n700,789,IOGURTE,9.90,0";
    expect(parseCsv(csv)[0].ativo).toBe(false);
  });
});

describe("toCsv e parseCsv — ida e volta", () => {
  // A regressão que este teste trava. `toCsv` sempre envolve os campos em
  // aspas; a versão anterior do `parseCsv` fazia `split(",")` e só depois
  // tirava as aspas. Um nome com vírgula era partido em dois, deslocando todas
  // as colunas seguintes — e o produto voltava com preço e código trocados.
  it("preserva nome com vírgula ao exportar e reimportar", () => {
    const original = produto({ nome: "QUEIJO, MEIA CURA" });

    const volta = parseCsv(toCsv([original]))[0];

    expect(volta.nome).toBe("QUEIJO, MEIA CURA");
    expect(volta.codigo).toBe("700");
    expect(volta.preco).toBe(9.9);
  });

  it("preserva aspas dentro do nome", () => {
    const original = produto({ nome: 'REQUEIJAO "CREMOSO"' });
    expect(parseCsv(toCsv([original]))[0].nome).toBe('REQUEIJAO "CREMOSO"');
  });

  it("preserva os demais campos numa ida e volta simples", () => {
    const volta = parseCsv(toCsv([produto({ ativo: false })]))[0];
    expect(volta).toMatchObject({
      codigo: "700",
      codigoBarras: "7891000100103",
      nome: "IOGURTE",
      preco: 9.9,
      categoriaImposto: "T",
      ativo: false,
    });
  });
});
