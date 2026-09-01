import { splitCsvLine } from "../lib/csv";

/**
 * Leitura de linha CSV — compartilhada entre os imports de produtos e balanças.
 *
 * O mesmo defeito existia em DUAS implementações separadas: ambas faziam
 * `line.split(",")` e só depois removiam as aspas, partindo qualquer campo
 * citado que contivesse vírgula.
 */
describe("splitCsvLine", () => {
  it("separa campos simples", () => {
    expect(splitCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  // A regressão. No import de balanças isso truncava o nome, punha um pedaço
  // dele no IP e o IP na porta — a balança ficava cadastrada e inalcançável.
  it("não parte um campo citado que contém vírgula", () => {
    const linha = '"loja-1","Balanca Acougue, fundo","192.168.15.8","33581"';

    expect(splitCsvLine(linha)).toEqual([
      "loja-1",
      "Balanca Acougue, fundo",
      "192.168.15.8",
      "33581",
    ]);
  });

  it("trata aspas duplicadas como aspa literal", () => {
    expect(splitCsvLine('"diz ""oi""","b"')).toEqual(['diz "oi"', "b"]);
  });

  it("preserva campos vazios, para as colunas não deslocarem", () => {
    expect(splitCsvLine("a,,c")).toEqual(["a", "", "c"]);
  });

  it("remove espaços em volta dos campos", () => {
    expect(splitCsvLine(" a , b ")).toEqual(["a", "b"]);
  });
});
