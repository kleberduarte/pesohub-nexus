/**
 * Converte um layout de etiqueta do software oficial da Ramuza para o formato
 * do PesoHub (card #52).
 *
 * Os 62 modelos de fábrica vivem em `ECS.mdb` (tabelas `Label` e `LabelItem`).
 * O valor deles não é a quantidade: são layouts que comprovadamente imprimem no
 * hardware. O dicionário de flags lista campos que os modelos de fábrica NÃO
 * usam — data e validade têm entradas em "Item" que não imprimem nada, e o
 * template oficial usa `7/3/2` e `7/3/3`. Copiar o template é copiar as
 * combinações que funcionam, em vez de descobri-las na tentativa e erro.
 *
 * Como o Node não lê `.mdb`, a extração é feita à parte (PowerShell + driver
 * ACE, senha `showmethemoney`) e este script consome o JSON resultante:
 *
 *   npx ts-node scripts/importar-layout-ramuza.ts <arquivo.json> [--numero N] [--gravar]
 *
 * Sem `--gravar` ele só imprime o resultado e o relatório de conversão — que é
 * o modo que interessa enquanto o mapeamento não estiver validado contra
 * impressão real.
 */
import { Prisma, PrismaClient } from "@prisma/client";

/** Pontos de impressão por milímetro (203 dpi). */
const PONTOS_POR_MM = 8;

type ElementoTipo =
  | "nome"
  | "preco"
  | "precoUnitario"
  | "peso"
  | "tara"
  | "validade"
  | "dataEmbalagem"
  | "pesoBrutoLiquido"
  | "lote"
  | "textoExtra5"
  | "textoExtra7"
  | "codigoBarras"
  | "texto"
  | "imagem"
  | "tabelaNutricional"
  | "selos"
  | "ingredientes"
  | "borda"
  | "divisoria";

interface ItemRamuza {
  SubID: number;
  Left: number;
  Top: number;
  Width: number;
  Height: number;
  Font: number;
  Align: number;
  Angle: number;
  Flag1: number;
  Flag2: number;
  Flag3: number;
  Print: number;
}

interface ArquivoExportado {
  label: Record<string, unknown> & { LabelID: number; Name: string; Width: number; Height: number };
  items: ItemRamuza[];
}

/**
 * Condição de impressão (`Print` do `LabelItem`).
 *
 * NÃO é liga/desliga: a Ramuza empilha elementos alternativos NA MESMA
 * coordenada e usa este campo para escolher qual sai. No `60x80 Padrão`,
 * "Peso:"/"Preço/kg:" (2) e "Peças:"/"Preço/pç:" (3) ocupam exatamente o mesmo
 * lugar. Importar os dois deixa os textos sobrepostos e ilegíveis no editor —
 * foi o que aconteceu na primeira importação.
 */
const PRINT_SEMPRE = 1;
const PRINT_POR_PESO = 2;
const PRINT_POR_PECA = 3;

/**
 * Traduz o trio Flag1/Flag2/Flag3 para o tipo de elemento do PesoHub.
 *
 * Devolve `null` quando o elemento não tem equivalente no editor.
 */
function mapearTipo(
  item: ItemRamuza,
): { tipo: ElementoTipo; textoDoCabecalho?: number; textoLiteral?: string; espessura?: number } | null {
  switch (item.Flag1) {
    case 0:
      return { tipo: "codigoBarras" };

    // "Item": Flag3 escolhe o campo do PLU.
    case 1:
      switch (item.Flag3) {
        case 0:
          return { tipo: "nome" };
        case 1:
          return { tipo: "peso" };
        case 2:
          return { tipo: "tara" };
        case 4:
        case 25:
          return { tipo: "precoUnitario" };
        case 5:
          return { tipo: "preco" };
        case 13:
          return { tipo: "dataEmbalagem" };
        case 15:
          return { tipo: "validade" };
        // Ingredientes chegam à balança pelo Texto extra 4 do PLU — não pelo
        // campo "Ingredientes" do NU3, que persiste mas nada renderiza.
        case 19:
          return { tipo: "ingredientes" };
        case 21:
          return { tipo: "lote" };
        case 23:
          return { tipo: "pesoBrutoLiquido" };
        default:
          return null;
      }

    // "Informação de venda": Flag2 escolhe o campo.
    case 2:
      switch (item.Flag2) {
        case 7:
          return { tipo: "peso" };
        case 8:
          return { tipo: "preco" };
        // As unidades são rótulos fixos e o editor não tem tipo próprio para
        // elas: viram texto livre, que na gravação ocupa um dos 32 slots de
        // texto constante do cabeçalho LAB. Sem isso a etiqueta importada sai
        // com o preço e o peso soltos, sem "R$" nem "kg" ao lado.
        case 12:
          return { tipo: "texto", textoLiteral: "kg" };
        case 16:
          return { tipo: "texto", textoLiteral: "R$" };
        default:
          // Nome da loja (0) depende da loja de destino, não do template.
          return null;
      }

    // Textos constantes: Flag2 é o índice do Text1..Text32 do cabeçalho.
    case 3:
      return { tipo: "texto", textoDoCabecalho: item.Flag2 };

    case 6:
      return { tipo: "imagem" };

    // "Impressão customizada".
    case 7:
      if (item.Flag2 === 0) return { tipo: "tabelaNutricional" };
      if (item.Flag2 === 2) return { tipo: "selos" };
      if (item.Flag2 === 3) {
        // "Tare or Not (B/L)" — o "B" que aparece ao lado do peso.
        if (item.Flag3 === 1) return { tipo: "pesoBrutoLiquido" };
        if (item.Flag3 === 2) return { tipo: "dataEmbalagem" };
        if (item.Flag3 === 3) return { tipo: "validade" };
        if (item.Flag3 === 4) return { tipo: "ingredientes" };
      }
      return null;

    // Borda: o Flag2 É a espessura (1..15), conforme o LabelItem.xml oficial.
    case 4:
      return { tipo: "borda", espessura: item.Flag2 };

    // Divisória: o Flag2 escolhe o comportamento. Só "Imprimir linha" (2)
    // desenha algo — "Flag da área" (0) é marcador de região invisível e
    // "Imprimir página" (1) é controle de paginação. Importar os invisíveis
    // encheria o editor de caixas que não imprimem nada; 121 dos 137 dos
    // modelos de fábrica são justamente esses.
    case 5:
      return item.Flag2 === 2 ? { tipo: "divisoria" } : null;

    default:
      return null;
  }
}

const NOME_FLAG1: Record<number, string> = {
  0: "Código de barras",
  1: "Item",
  2: "Informação de venda",
  3: "Texto constante",
  4: "Borda",
  5: "Divisória",
  6: "Imagem",
  7: "Impressão customizada",
};

/** Pontos -> milímetros, com 2 casas (o editor trabalha em passos de 0,25mm). */
function paraMm(pontos: number): number {
  return Math.round((pontos / PONTOS_POR_MM) * 100) / 100;
}

function alinhamentoPesoHub(align: number): 0 | 1 | 2 {
  // O `Align` da Ramuza tem mais variações do que o editor expõe; o que
  // interessa é a horizontal.
  if (align === 1 || align === 4 || align === 7) return 2;
  if (align === 2 || align === 5 || align === 8) return 1;
  return 0;
}

function anguloPesoHub(angle: number): 0 | 90 | 180 | 270 {
  return (([0, 90, 180, 270] as const)[angle] ?? 0) as 0 | 90 | 180 | 270;
}

export function converter(arquivo: ArquivoExportado, opcoes: { venda?: "peso" | "peca" } = {}) {
  const { label, items } = arquivo;
  const venda = opcoes.venda ?? "peso";
  const printDoRamoOposto = venda === "peso" ? PRINT_POR_PECA : PRINT_POR_PESO;
  const textosDoCabecalho: Record<number, string> = {};
  for (let i = 1; i <= 32; i++) {
    const valor = label[`Text${i}`];
    if (typeof valor === "string" && valor.trim().length > 0) textosDoCabecalho[i - 1] = valor;
  }

  const elementos: Record<string, unknown>[] = [];
  const ignorados: { subId: number; motivo: string }[] = [];

  const condicionaisDescartados: number[] = [];
  const printDesconhecidos = new Map<number, number>();

  for (const item of items) {
    // O ramo oposto ocupa as mesmas coordenadas do escolhido; trazer os dois
    // sobrepõe os textos.
    if (item.Print === printDoRamoOposto) {
      condicionaisDescartados.push(item.SubID);
      continue;
    }
    if (item.Print !== PRINT_SEMPRE && item.Print !== PRINT_POR_PESO && item.Print !== PRINT_POR_PECA) {
      // Print 9 e 30 aparecem nos modelos de fábrica e ainda não sabemos o que
      // condicionam. Entram, mas ficam registrados no relatório: descartar
      // conteúdo que talvez seja válido é pior do que sinalizar a dúvida.
      printDesconhecidos.set(item.Print, (printDesconhecidos.get(item.Print) ?? 0) + 1);
    }

    const mapeado = mapearTipo(item);
    if (!mapeado) {
      ignorados.push({
        subId: item.SubID,
        motivo: `${NOME_FLAG1[item.Flag1] ?? `Flag1=${item.Flag1}`} (${item.Flag1}/${item.Flag2}/${item.Flag3})`,
      });
      continue;
    }

    const elemento: Record<string, unknown> = {
      id: `${mapeado.tipo}-ramuza${label.LabelID}-${item.SubID}`,
      tipo: mapeado.tipo,
      x: paraMm(item.Left),
      y: paraMm(item.Top),
      largura: paraMm(item.Width),
      altura: paraMm(item.Height),
    };

    if (mapeado.espessura != null) elemento.espessura = mapeado.espessura;
    if (item.Angle) elemento.angulo = anguloPesoHub(item.Angle);
    if (item.Align) elemento.alinhamento = alinhamentoPesoHub(item.Align);
    if (item.Font) elemento.fonte = item.Font;
    if (mapeado.textoDoCabecalho != null) {
      elemento.texto = textosDoCabecalho[mapeado.textoDoCabecalho] ?? "";
    }
    if (mapeado.textoLiteral != null) elemento.texto = mapeado.textoLiteral;

    elementos.push(elemento);
  }

  return {
    nome: label.Name,
    larguraMm: Math.round(label.Width / PONTOS_POR_MM),
    alturaMm: Math.round(label.Height / PONTOS_POR_MM),
    layout: { elementos },
    relatorio: {
      total: items.length,
      convertidos: elementos.length,
      ignorados,
      venda,
      condicionaisDescartados,
      printDesconhecidos: [...printDesconhecidos.entries()].map(([print, qtd]) => ({ print, qtd })),
    },
  };
}

/**
 * Variante autoral: um modelo de fábrica mais elementos que ele não tem.
 *
 * A Ramuza só traz tabela nutricional nos modelos "com tabela" (60x120 e
 * 60x170). A combinação que as lojas pedem — o 60x80 Padrão com tabela — não
 * existe no ECS.mdb, e foi ela que imprimiu certo no hardware em 01/09. Em vez
 * de editar o catálogo gerado à mão (que o próximo `--catalogo` sobrescreveria),
 * as variantes ficam declaradas em `layouts-padrao-extras.json` e são aplicadas
 * sobre a base a cada geração.
 */
interface VarianteExtra {
  baseId: string;
  id: string;
  nome: string;
  elementosExtras: Array<Record<string, unknown>>;
}

/**
 * Gera o catálogo estático que a aba "Layouts padrão" consome. Os modelos de
 * fábrica não mudam, e são iguais para todas as lojas: virar tabela no banco
 * custaria migração e seed para dados que nascem congelados no ECS.mdb. Como
 * arquivo, a aba é somente-leitura por construção — não há o que estragar.
 */
function gerarCatalogo(diretorio: string, saida: string) {
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");

  const arquivos = fs
    .readdirSync(diretorio)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const modelos: Array<{
    id: string;
    nome: string;
    larguraMm: number;
    alturaMm: number;
    elementos: Array<Record<string, unknown>>;
  }> = arquivos.map((f) => {
    const bruto = fs.readFileSync(path.join(diretorio, f), "utf8").replace(/^﻿/, "");
    const convertido = converter(JSON.parse(bruto) as ArquivoExportado);
    return {
      id: `ramuza-${path.basename(f, ".json").replace(/^ramuza-label-/, "")}`,
      nome: convertido.nome,
      larguraMm: convertido.larguraMm,
      alturaMm: convertido.alturaMm,
      elementos: convertido.layout.elementos,
    };
  });

  const arquivoExtras = path.join(__dirname, "layouts-padrao-extras.json");
  if (fs.existsSync(arquivoExtras)) {
    const extras = JSON.parse(
      fs.readFileSync(arquivoExtras, "utf8").replace(/^﻿/, ""),
    ) as VarianteExtra[];
    for (const extra of extras) {
      const base = modelos.find((m) => m.id === extra.baseId);
      if (!base) {
        // Sem a base, a variante sairia com geometria errada — melhor faltar no
        // catálogo do que entrar torta.
        console.warn(`variante ${extra.id}: base ${extra.baseId} não está no catálogo, ignorada`);
        continue;
      }
      modelos.push({
        id: extra.id,
        nome: extra.nome,
        larguraMm: base.larguraMm,
        alturaMm: base.alturaMm,
        elementos: [...base.elementos, ...extra.elementosExtras],
      });
    }
  }

  const cabecalho = `// GERADO por backend/scripts/importar-layout-ramuza.ts --catalogo — não editar à mão.
// Origem: tabelas Label/LabelItem do ECS.mdb do software oficial da Ramuza,
// extraídas por backend/scripts/extrair-layouts-ramuza.ps1.
// Os modelos com id \`pesohub-*\` são variantes declaradas em
// backend/scripts/layouts-padrao-extras.json — combinações que as lojas pedem e
// que não existem nos modelos de fábrica.

export interface LayoutPadrao {
  id: string;
  nome: string;
  larguraMm: number;
  alturaMm: number;
  elementos: Array<Record<string, unknown>>;
}

export const LAYOUTS_PADRAO: LayoutPadrao[] = `;

  fs.writeFileSync(saida, cabecalho + JSON.stringify(modelos, null, 2) + ";\n", "utf8");
  console.log(`${modelos.length} layouts -> ${saida}`);
  for (const m of modelos) {
    console.log(`  ${m.nome} (${m.larguraMm}x${m.alturaMm}mm, ${m.elementos.length} elementos)`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const idxCatalogo = argv.indexOf("--catalogo");
  if (idxCatalogo >= 0) {
    const idxSaida = argv.indexOf("--saida");
    if (idxSaida < 0) {
      console.error("--catalogo <dir> exige --saida <arquivo.ts>");
      process.exit(1);
    }
    gerarCatalogo(argv[idxCatalogo + 1], argv[idxSaida + 1]);
    return;
  }

  const [caminho, ...resto] = argv;
  if (!caminho) {
    console.error(
      "uso: importar-layout-ramuza.ts <arquivo.json> [--venda peso|peca] [--gravar --numero N --loja <id>]\n" +
        "     importar-layout-ramuza.ts --catalogo <dir-com-jsons> --saida <arquivo.ts>",
    );
    process.exit(1);
  }

  const gravar = resto.includes("--gravar");
  const idxVenda = resto.indexOf("--venda");
  const venda = (idxVenda >= 0 ? resto[idxVenda + 1] : "peso") as "peso" | "peca";
  const idxNumero = resto.indexOf("--numero");
  const numero = idxNumero >= 0 ? Number(resto[idxNumero + 1]) : null;

  // O `Out-File -Encoding utf8` do PowerShell 5.1 grava com BOM, que o
  // JSON.parse não engole.
  const bruto = (require("fs").readFileSync(caminho, "utf8") as string).replace(/^﻿/, "");
  const arquivo = JSON.parse(bruto) as ArquivoExportado;
  const resultado = converter(arquivo, { venda });

  console.log(`\nLayout: ${resultado.nome} (${resultado.larguraMm}mm x ${resultado.alturaMm}mm)`);
  console.log(`Elementos: ${resultado.relatorio.convertidos} de ${resultado.relatorio.total} convertidos`);
  console.log(`Ramo de venda: ${resultado.relatorio.venda}`);
  if (resultado.relatorio.condicionaisDescartados.length > 0) {
    console.log(
      `Descartados por serem do ramo oposto: ${resultado.relatorio.condicionaisDescartados.length} (alternativos na mesma posição)`,
    );
  }
  for (const { print, qtd } of resultado.relatorio.printDesconhecidos) {
    console.log(`  atenção: ${qtd}x com Print=${print}, condição desconhecida — importados assim mesmo`);
  }

  if (resultado.relatorio.ignorados.length > 0) {
    const porMotivo = new Map<string, number>();
    for (const i of resultado.relatorio.ignorados) {
      const chave = i.motivo.split(" (")[0];
      porMotivo.set(chave, (porMotivo.get(chave) ?? 0) + 1);
    }
    console.log("\nIgnorados (sem equivalente no editor):");
    for (const [motivo, qtd] of porMotivo) console.log(`  ${qtd}x ${motivo}`);
  }

  if (!gravar) {
    console.log("\n--- layout convertido ---");
    console.log(JSON.stringify(resultado.layout, null, 2));
    console.log("\n(dry-run; use --gravar --numero N para persistir)");
    return;
  }

  if (numero == null || Number.isNaN(numero)) {
    console.error("--gravar exige --numero N (o slot do formato na loja)");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    // A loja é obrigatória: o formato é por-Loja, e escolher "a primeira" grava
    // silenciosamente na loja errada — foi o que aconteceu no primeiro teste.
    const idxLoja = resto.indexOf("--loja");
    const lojaId = idxLoja >= 0 ? resto[idxLoja + 1] : null;
    if (!lojaId) {
      const lojas = await prisma.loja.findMany({ select: { id: true, nome: true }, orderBy: { createdAt: "asc" } });
      console.error("--gravar exige --loja <id>. Lojas disponíveis:");
      for (const l of lojas) console.error(`  ${l.id}  ${l.nome}`);
      process.exit(1);
    }

    const loja = await prisma.loja.findUnique({ where: { id: lojaId } });
    if (!loja) throw new Error(`Loja ${lojaId} não encontrada`);

    // O layout é um objeto com array dentro; o tipo gerado do Prisma para Json
    // não aceita Record<string, unknown>[] sem esta ponte.
    const layoutJson = resultado.layout as unknown as Prisma.InputJsonObject;

    const criado = await prisma.formatoImpressao.upsert({
      where: { lojaId_numero: { lojaId: loja.id, numero } },
      update: { nome: resultado.nome, larguraMm: resultado.larguraMm, alturaMm: resultado.alturaMm, layout: layoutJson },
      create: {
        clienteId: loja.clienteId,
        lojaId: loja.id,
        numero,
        nome: resultado.nome,
        larguraMm: resultado.larguraMm,
        alturaMm: resultado.alturaMm,
        layout: layoutJson,
      },
    });
    console.log(`\nGravado: formato ${criado.numero} "${criado.nome}" na loja ${loja.nome}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
