import type { CreateProductInput, Product } from "./api";

/**
 * Importação e exportação de produtos em CSV.
 *
 * Estas funções eram puras e já viviam fora do componente em
 * `app/(dashboard)/products/page.tsx` — foram movidas para cá para poderem ser
 * testadas sem montar uma página de 1.140 linhas (card #64).
 */

/** Colunas obrigatórias no cabeçalho de importação. */
const OBRIGATORIAS = ["codigo", "codigoBarras", "nome", "preco"] as const;

export function toCsv(products: Product[]): string {
  const header = ["codigo", "codigoBarras", "nome", "preco", "categoriaImposto", "ativo"];
  const rows = products.map((p) =>
    [p.codigo, p.codigoBarras, p.nome, p.preco, p.categoriaImposto ?? "", p.ativo ? "1" : "0"]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\r\n");
}

/**
 * Divide uma linha de CSV respeitando aspas.
 *
 * A vírgula só separa campos quando está FORA de aspas — um nome como
 * `"Queijo, meia cura"` é um campo só. A versão anterior fazia `line.split(",")`
 * e depois tirava as aspas, o que partia esse nome em dois e deslocava todas as
 * colunas seguintes. Como `toCsv` sempre envolve os campos em aspas, o defeito
 * aparecia ao exportar e reimportar o próprio arquivo.
 */
function splitLine(line: string): string[] {
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

export function parseCsv(text: string): CreateProductInput[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const idx = {
    codigo: header.indexOf("codigo"),
    codigoBarras: header.indexOf("codigobarras"),
    nome: header.indexOf("nome"),
    preco: header.indexOf("preco"),
    categoriaImposto: header.indexOf("categoriaimposto"),
    ativo: header.indexOf("ativo"),
  };
  if (idx.codigo === -1 || idx.codigoBarras === -1 || idx.nome === -1 || idx.preco === -1) {
    throw new Error(
      `CSV inválido: cabeçalho deve conter ao menos "${OBRIGATORIAS.join(",")}" (categoriaImposto e ativo são opcionais).`,
    );
  }

  return lines.slice(1).map((line) => {
    const fields = splitLine(line);
    return {
      codigo: fields[idx.codigo] ?? "",
      codigoBarras: fields[idx.codigoBarras] ?? "",
      nome: fields[idx.nome] ?? "",
      preco: Number(fields[idx.preco]?.replace(",", ".") ?? 0),
      categoriaImposto: idx.categoriaImposto >= 0 ? fields[idx.categoriaImposto] : undefined,
      ativo: idx.ativo >= 0 ? fields[idx.ativo] === "1" || fields[idx.ativo]?.toLowerCase() === "true" : true,
    };
  });
}
