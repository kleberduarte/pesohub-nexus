/**
 * Desenho dos selos de advertência nutricional ("ALTO EM ...") como bitmaps
 * monocromáticos, pra serem enviados à balança pelo bloco `DWL/BMP`.
 *
 * Por que desenhar em vez de mandar texto: o equipamento não tem conceito de
 * "selo". O campo de Alérgicos imprime só texto corrido; o visual em caixa
 * preta que a etiqueta oficial mostra é uma IMAGEM referenciada pelo layout
 * (`Flag1=6`, `Flag2` = id do bitmap). Ver card #31.
 *
 * A fonte é uma 5x7 embutida — sem dependência externa, e o traço fica
 * legível na resolução da impressora térmica (8 pontos/mm).
 */

import type { BitmapMonocromatico } from "./bitmap-wire";
import { ANVISA, ordenarSelos } from "./selos-anvisa";
import { FONTE_CONDENSADA, LARGURA_GLIFO_CONDENSADO, ALTURA_GLIFO_CONDENSADO } from "./fonte-condensada";

/** Alias local pra fonte condensada 4x7 (aproximação da Arial Narrow que a
 * norma exige — ver `fonte-condensada.ts`). */
const FONTE = FONTE_CONDENSADA;
const LARGURA_GLIFO = LARGURA_GLIFO_CONDENSADO;
const ALTURA_GLIFO = ALTURA_GLIFO_CONDENSADO;
const ESPACO_ENTRE_GLIFOS = 1;
/** Linhas extras acima do glifo pra acomodar acento (e uma abaixo pra cedilha). */
const ALTURA_ACENTO = 2;
const ALTURA_CEDILHA = 2;

/** Diacríticos desenhados por cima do glifo base, como colunas de 5 bits. */
const ACENTOS: Record<string, number[]> = {
  agudo: [0x00, 0x02, 0x01, 0x00],
  grave: [0x00, 0x01, 0x02, 0x00],
  til: [0x02, 0x01, 0x02, 0x01],
  circunflexo: [0x02, 0x01, 0x01, 0x02],
  trema: [0x02, 0x00, 0x00, 0x02],
};

/** Caracteres acentuados que os rótulos usam → letra base + diacrítico. */
const DECOMPOSICAO: Record<string, { base: string; acento?: keyof typeof ACENTOS; cedilha?: boolean }> = {
  Á: { base: "A", acento: "agudo" },
  À: { base: "A", acento: "grave" },
  Ã: { base: "A", acento: "til" },
  Â: { base: "A", acento: "circunflexo" },
  É: { base: "E", acento: "agudo" },
  Ê: { base: "E", acento: "circunflexo" },
  Í: { base: "I", acento: "agudo" },
  Ó: { base: "O", acento: "agudo" },
  Ô: { base: "O", acento: "circunflexo" },
  Õ: { base: "O", acento: "til" },
  Ú: { base: "U", acento: "agudo" },
  Ü: { base: "U", acento: "trema" },
  Ç: { base: "C", cedilha: true },
};

/** Caixa alta preservando os acentos que sabemos desenhar. */
function normalizar(texto: string): string {
  return texto.normalize("NFC").toUpperCase();
}

function larguraTexto(texto: string, escala: number): number {
  const n = texto.length;
  if (n === 0) return 0;
  return (n * LARGURA_GLIFO + (n - 1) * ESPACO_ENTRE_GLIFOS) * escala;
}

interface Canvas {
  largura: number;
  altura: number;
  pixels: Uint8Array;
}

function novoCanvas(largura: number, altura: number): Canvas {
  return { largura, altura, pixels: new Uint8Array(largura * altura) };
}

function pintar(c: Canvas, x: number, y: number, ligado: boolean): void {
  if (x < 0 || y < 0 || x >= c.largura || y >= c.altura) return;
  c.pixels[y * c.largura + x] = ligado ? 1 : 0;
}

/** Retângulo de cantos arredondados, como as caixas da norma. */
function retangulo(c: Canvas, x: number, y: number, w: number, h: number, raio = 0): void {
  const r = Math.min(raio, Math.floor(Math.min(w, h) / 2));
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (r > 0) {
        // Recorta os quatro cantos com um quarto de círculo.
        const cx = dx < r ? r : dx >= w - r ? w - 1 - r : dx;
        const cy = dy < r ? r : dy >= h - r ? h - 1 - r : dy;
        if ((dx - cx) ** 2 + (dy - cy) ** 2 > r * r) continue;
      }
      pintar(c, x + dx, y + dy, true);
    }
  }
}

/** Bloco de escala x escala — o "pixel" lógico da fonte. */
function bloco(c: Canvas, x: number, y: number, escala: number, ligado: boolean): void {
  for (let sy = 0; sy < escala; sy++) {
    for (let sx = 0; sx < escala; sx++) pintar(c, x + sx, y + sy, ligado);
  }
}

/** Escreve texto; `invertido` desenha em branco (pra usar sobre fundo preto).
 * `y` é o topo da caixa do glifo, já descontando a faixa do acento. */
function escrever(c: Canvas, texto: string, x: number, y: number, escala: number, invertido: boolean): void {
  let cursor = x;
  for (const ch of normalizar(texto)) {
    const dec = DECOMPOSICAO[ch];
    const base = dec?.base ?? ch;
    const glifo = FONTE[base] ?? FONTE[" "];

    for (let col = 0; col < LARGURA_GLIFO; col++) {
      for (let lin = 0; lin < ALTURA_GLIFO; lin++) {
        if ((glifo[col] >> lin) & 1) {
          bloco(c, cursor + col * escala, y + lin * escala, escala, !invertido);
        }
      }
      if (dec?.acento) {
        const bits = ACENTOS[dec.acento][col];
        for (let lin = 0; lin < ALTURA_ACENTO; lin++) {
          if ((bits >> lin) & 1) {
            bloco(c, cursor + col * escala, y - (ALTURA_ACENTO - lin) * escala, escala, !invertido);
          }
        }
      }
    }
    if (dec?.cedilha) {
      // Rabinho abaixo do C, centralizado no glifo.
      const xc = cursor + 1 * escala;
      bloco(c, xc, y + ALTURA_GLIFO * escala, escala, !invertido);
      bloco(c, xc - escala, y + (ALTURA_GLIFO + 1) * escala, escala, !invertido);
    }
    cursor += (LARGURA_GLIFO + ESPACO_ENTRE_GLIFOS) * escala;
  }
}

/** Quebra o rótulo em até `maxLinhas`, respeitando a largura disponível. */
function quebrarEmLinhas(texto: string, escala: number, larguraDisponivel: number, maxLinhas: number): string[] {
  const palavras = normalizar(texto).split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (larguraTexto(tentativa, escala) <= larguraDisponivel || !atual) {
      atual = tentativa;
    } else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  return linhas.length > maxLinhas ? [] : linhas;
}

/**
 * Desenha a faixa da rotulagem nutricional frontal seguindo as proporções do
 * Anexo XVIII da IN 75/2020 (ver `selos-anvisa.ts` pra tabela completa e pras
 * ressalvas do que não dá pra cumprir numa impressora térmica).
 *
 * O tamanho é dado em milímetros (a impressora trabalha a 8 pontos/mm, mesma
 * escala do resto do layout) e todo o resto é derivado de Y (altura da letra)
 * e Z (espessura do traço), escolhidos pelo maior Y que faça a faixa inteira
 * caber na caixa pedida.
 */
export function desenharFaixaSelos(selos: string[], larguraMm: number, alturaMm: number): BitmapMonocromatico {
  const PONTOS_POR_MM = 8;
  const largura = Math.max(1, Math.round(larguraMm * PONTOS_POR_MM));
  const altura = Math.max(1, Math.round(alturaMm * PONTOS_POR_MM));
  const c = novoCanvas(largura, altura);

  const rotulos = ordenarSelos(selos);
  if (rotulos.length === 0) return { largura, altura, pixels: c.pixels };

  // Y é a altura da letra; na fonte 5x7 isso é ALTURA_GLIFO * escala. Testa
  // da maior escala pra menor e fica com a primeira que couber inteira.
  let plano: ReturnType<typeof planejar> | null = null;
  for (const escala of [3, 2, 1]) {
    const p = planejar(rotulos, largura, altura, escala);
    if (p != null) {
      plano = p;
      break;
    }
  }
  if (plano == null) return { largura, altura, pixels: c.pixels };

  const { Y, Z, escala, larguraModulo, alturaModulo, linhasPorSelo, x0, y0, larguraTotal } = plano;

  // Borda externa (espessura 1Z, cantos arredondados), envolvendo tudo.
  const alturaBorda = alturaModulo + 2 * ANVISA.margemInternaZ * Z + 2 * ANVISA.bordaEspessuraZ * Z;
  const raioBorda = Math.max(2, Math.round(Z * 3));
  moldura(c, x0, y0, larguraTotal, alturaBorda, Math.max(1, Math.round(ANVISA.bordaEspessuraZ * Z)), raioBorda);

  const yModulo = y0 + Math.round((alturaBorda - alturaModulo) / 2);
  let x = x0 + Math.round(ANVISA.bordaEspessuraZ * Z + ANVISA.margemInternaZ * Z);

  // Bloco "ALTO EM": lupa à esquerda + texto preto sobre branco (sem caixa).
  const diametro = ANVISA.lupaDiametroY * Y;
  const espessuraAnel = Math.max(1, Math.round(ANVISA.lupaEspessuraZ * Z));
  lupaAnvisa(c, x, yModulo, alturaModulo, diametro, espessuraAnel, Y, Z);

  const larguraLupa = Math.round(diametro + ANVISA.cabaoComprimentoY * Y * 0.6);
  x += larguraLupa + Math.round(ANVISA.lupaAteBlocoZ * Z);
  escrever(c, "ALTO EM", x, yModulo + Math.round((alturaModulo - ALTURA_GLIFO * escala) / 2), escala, false);
  x += larguraTexto("ALTO EM", escala) + Math.round(ANVISA.entreBlocosZ * Z);

  // Módulos dos nutrientes: branco sobre preto, texto centralizado.
  const raioModulo = Math.max(2, Math.round(Z * 2.5));
  const alturaLinha = (ALTURA_GLIFO + ALTURA_ACENTO) * escala;
  for (const linhas of linhasPorSelo) {
    retangulo(c, x, yModulo, larguraModulo, alturaModulo, raioModulo);
    const alturaBloco = linhas.length * ALTURA_GLIFO * escala + (linhas.length - 1) * ALTURA_ACENTO * escala;
    let y = yModulo + Math.round((alturaModulo - alturaBloco) / 2);
    for (const linha of linhas) {
      const xTexto = x + Math.round((larguraModulo - larguraTexto(linha, escala)) / 2);
      escrever(c, linha, xTexto, y, escala, true);
      y += alturaLinha;
    }
    x += larguraModulo + Math.round(ANVISA.entreBlocosZ * Z);
  }

  return { largura, altura, pixels: c.pixels };
}

/** Resolve as medidas da faixa pra uma escala de fonte; null se não couber. */
function planejar(rotulos: string[], largura: number, altura: number, escala: number) {
  const Y = ALTURA_GLIFO * escala;
  const Z = escala; // espessura do traço da fonte — a letra "I" da 5x7 tem 1px de haste
  const alturaModulo = Math.round(ANVISA.moduloAlturaY * Y);
  const alturaBorda = alturaModulo + 2 * ANVISA.margemInternaZ * Z + 2 * ANVISA.bordaEspessuraZ * Z;
  if (alturaBorda > altura) return null;

  // Largura nominal do módulo é 8Y, mas a nossa fonte é mais larga que a
  // Arial Narrow da norma — deixamos crescer o mínimo necessário pro rótulo
  // caber inteiro, em no máximo 2 linhas.
  const maxLinhas = Math.max(1, Math.floor(alturaModulo / ((ALTURA_GLIFO + ALTURA_ACENTO) * escala)));
  const nominal = Math.round(ANVISA.moduloLarguraY * Y);
  const linhasPorSelo: string[][] = [];
  // Largura que o texto realmente exige. A norma pede 8Y fixo, mas manter
  // isso à força só faz a fonte encolher — preferimos o módulo mais estreito
  // com o texto maior, e voltamos ao nominal quando houver espaço (abaixo).
  let larguraModulo = 0;
  for (const r of rotulos) {
    const linhas = quebrarEmLinhas(r, escala, nominal, Math.min(2, maxLinhas));
    const usar = linhas.length > 0 ? linhas : [normalizar(r)];
    linhasPorSelo.push(usar);
    for (const l of usar) larguraModulo = Math.max(larguraModulo, larguraTexto(l, escala) + 4 * escala);
  }

  const diametro = ANVISA.lupaDiametroY * Y;
  const larguraLupa = Math.round(diametro + ANVISA.cabaoComprimentoY * Y * 0.6);
  const fixo =
    2 * ANVISA.bordaEspessuraZ * Z +
    2 * ANVISA.margemInternaZ * Z +
    larguraLupa +
    ANVISA.lupaAteBlocoZ * Z +
    larguraTexto("ALTO EM", escala) +
    ANVISA.entreBlocosZ * Z +
    (rotulos.length - 1) * ANVISA.entreBlocosZ * Z;

  if (fixo + rotulos.length * larguraModulo > largura) return null;

  // Sobrou espaço: aproxima da largura nominal de 8Y prevista na norma.
  const folga = Math.floor((largura - fixo - rotulos.length * larguraModulo) / rotulos.length);
  larguraModulo = Math.min(nominal, larguraModulo + Math.max(0, folga));

  const larguraTotal = fixo + rotulos.length * larguraModulo;

  return {
    Y,
    Z,
    escala,
    larguraModulo,
    alturaModulo,
    linhasPorSelo,
    larguraTotal: Math.round(larguraTotal),
    x0: Math.round((largura - larguraTotal) / 2),
    y0: Math.round((altura - alturaBorda) / 2),
  };
}

/** Retângulo vazado de cantos arredondados — a borda externa da norma. */
function moldura(c: Canvas, x: number, y: number, w: number, h: number, espessura: number, raio: number): void {
  const dentro = novoCanvas(w, h);
  retangulo(dentro, 0, 0, w, h, raio);
  const buraco = novoCanvas(w, h);
  retangulo(buraco, espessura, espessura, w - 2 * espessura, h - 2 * espessura, Math.max(1, raio - espessura));
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (dentro.pixels[dy * w + dx] && !buraco.pixels[dy * w + dx]) pintar(c, x + dx, y + dy, true);
    }
  }
}

/** Lupa do Anexo XVIII: anel + cabo inclinado 30°, com a conexão entre eles. */
function lupaAnvisa(
  c: Canvas,
  x: number,
  yModulo: number,
  alturaModulo: number,
  diametro: number,
  espessura: number,
  Y: number,
  Z: number,
): void {
  const raio = diametro / 2;
  const ang = ((90 + ANVISA.caboInclinacaoGraus) * Math.PI) / 180;
  const comprimentoCabo = ANVISA.cabaoComprimentoY * Y;

  // Centraliza o CONJUNTO (anel + cabo) na altura do módulo — centralizar só
  // o anel jogava a ponta do cabo pra fora da moldura.
  const alturaConjunto = raio + (raio - espessura / 2 + comprimentoCabo) * Math.sin(ang);
  const cy = yModulo + (alturaModulo - alturaConjunto) / 2 + raio;
  // Idem na horizontal: o cabo avança pra esquerda, então o anel desloca pra direita.
  const recuoCabo = Math.abs((raio - espessura / 2 + comprimentoCabo) * Math.cos(ang)) - raio;
  const cx = x + raio + Math.max(0, recuoCabo);
  for (let dy = -raio; dy <= raio; dy++) {
    for (let dx = -raio; dx <= raio; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= raio && d >= raio - espessura) pintar(c, Math.round(cx + dx), Math.round(cy + dy), true);
    }
  }

  // Cabo a 30° da vertical, saindo pela base do anel em direção à esquerda.
  const dirX = Math.cos(ang);
  const dirY = Math.sin(ang);
  const espessuraCabo = Math.max(1, Math.round(ANVISA.caboEspessuraZ * Z));
  for (let t = 0; t < comprimentoCabo; t += 0.5) {
    const px = cx + dirX * (raio - espessura / 2 + t);
    const py = cy + dirY * (raio - espessura / 2 + t);
    for (let e = -Math.floor(espessuraCabo / 2); e <= Math.floor(espessuraCabo / 2); e++) {
      pintar(c, Math.round(px - dirY * e), Math.round(py + dirX * e), true);
    }
  }
}

export const BMP_ID_SELOS_MAX = 15;

/**
 * Distribui ids de bitmap (1..15) entre as tabelas nutricionais que têm
 * selos, de forma estável dentro de uma mesma sincronização: a ordem é a dos
 * números de tabela, então o mesmo conjunto de produtos gera sempre os mesmos
 * ids. Tabelas além do 15º slot ficam de fora e caem no texto do Alérgico.
 */
export function atribuirIdsDeSelo(numerosDeTabela: number[]): Map<number, number> {
  const ids = new Map<number, number>();
  let proximo = 1;
  for (const numero of [...new Set(numerosDeTabela)].sort((a, b) => a - b)) {
    if (proximo > BMP_ID_SELOS_MAX) break;
    ids.set(numero, proximo++);
  }
  return ids;
}
