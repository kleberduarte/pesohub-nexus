/**
 * Leitura de CSV compartilhada entre as telas de importação.
 *
 * Existe como módulo próprio porque o mesmo defeito foi encontrado DUAS vezes
 * em implementações separadas — no import de produtos e no de balanças. Ambas
 * faziam `line.split(",")` e só depois removiam as aspas, o que parte um campo
 * citado que contenha vírgula e desloca todas as colunas seguintes.
 *
 * No import de balanças o efeito era um nome truncado, o IP recebendo um
 * pedaço do nome e a porta recebendo o IP — a balança ficava cadastrada e
 * inalcançável, e o sintoma aparecia como "timeout na sincronização", mandando
 * investigar rede em vez do cadastro.
 */
/**
 * Divide uma linha de CSV respeitando aspas.
 *
 * A vírgula só separa campos quando está FORA de aspas — um nome como
 * `"Queijo, meia cura"` é um campo só. A versão anterior fazia `line.split(",")`
 * e depois tirava as aspas, o que partia esse nome em dois e deslocava todas as
 * colunas seguintes. Como `toCsv` sempre envolve os campos em aspas, o defeito
 * aparecia ao exportar e reimportar o próprio arquivo.
 */
export function splitCsvLine(line: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      // Aspas duplicadas dentro de um campo citado são uma aspa literal.
      if (dentroDeAspas && line[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (c === "," && !dentroDeAspas) {
      campos.push(atual.trim());
      atual = "";
    } else {
      atual += c;
    }
  }
  campos.push(atual.trim());
  return campos;
}
