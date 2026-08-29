/**
 * Codificação de imagens monocromáticas para o bloco `DWL/BMP` da balança.
 *
 * Formato extraído do software oficial (`WizardPicForm.UpdateBMP()` +
 * `Program.To42/To44/To48` no código decompilado, e `NetForm.cs` linha ~4124
 * pra forma do bloco). Cada linha do wire é:
 *
 *     BMP\t<ID>\t<payload>\t
 *
 * e o payload é a concatenação de:
 *   - `to48(id)`           — o próprio ID de novo, 4 bytes little-endian
 *   - `to44(largura)`      — 2 bytes little-endian
 *   - `to44(altura)`       — 2 bytes little-endian
 *   - 176 caracteres "@"   — 22 blocos de 8 zeros, cabeçalho reservado
 *   - `to42(b)` por byte   — o bitmap 1bpp, `ceil(largura/8)` bytes por linha,
 *                            bit mais significativo = pixel mais à esquerda,
 *                            bit 1 = tinta (preto)
 *
 * O encoding `to42` é o detalhe menos óbvio: cada byte vira DOIS caracteres,
 * um por nibble, somando 64 ao valor — ou seja, só usa "@" (0) até "O" (15).
 * É o que mantém o payload dentro de ASCII imprimível e sem tabs.
 */

/** Um byte → 2 chars ("@"–"O"), nibble alto primeiro. */
function to42(byte: number): string {
  const b = byte & 0xff;
  return String.fromCharCode(64 + (b >> 4)) + String.fromCharCode(64 + (b & 0x0f));
}

/** Inteiro de 16 bits → 4 chars, little-endian. */
function to44(value: number): string {
  return to42(value & 0xff) + to42((value >> 8) & 0xff);
}

/** Inteiro de 32 bits → 8 chars, little-endian. */
function to48(value: number): string {
  return to42(value & 0xff) + to42((value >> 8) & 0xff) + to42((value >> 16) & 0xff) + to42((value >> 24) & 0xff);
}

/** 22 blocos de 8 zeros — cabeçalho reservado que o software oficial sempre
 * envia em branco entre as dimensões e os dados da imagem. */
const CABECALHO_RESERVADO = "@".repeat(22 * 8);

export interface BitmapMonocromatico {
  largura: number;
  altura: number;
  /** 1 byte por pixel: qualquer valor diferente de 0 vira tinta (preto). O
   * empacotamento em bits é feito aqui, pra quem chama não precisar saber do
   * formato do wire. */
  pixels: Uint8Array;
}

/** Empacota os pixels em 1bpp, `ceil(largura/8)` bytes por linha. */
function empacotarLinhas(bmp: BitmapMonocromatico): Uint8Array {
  const bytesPorLinha = Math.ceil(bmp.largura / 8);
  const out = new Uint8Array(bytesPorLinha * bmp.altura);
  for (let y = 0; y < bmp.altura; y++) {
    for (let x = 0; x < bmp.largura; x++) {
      if (bmp.pixels[y * bmp.largura + x] === 0) continue;
      out[y * bytesPorLinha + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return out;
}

/** Monta uma linha `BMP\t<id>\t<payload>\t\r\n` do bloco `DWL/BMP`. */
export function buildBmpRow(id: number, bmp: BitmapMonocromatico): string {
  const dados = empacotarLinhas(bmp);
  let payload = to48(id) + to44(bmp.largura) + to44(bmp.altura) + CABECALHO_RESERVADO;
  for (const b of dados) payload += to42(b);
  return `BMP\t${id}\t${payload}\t\r\n`;
}

/** Bloco completo `DWL/BMP ... END/BMP` pra um conjunto de imagens. */
export function buildBmpBlock(imagens: Map<number, BitmapMonocromatico>): string {
  if (imagens.size === 0) return "";
  const linhas = [...imagens.entries()].map(([id, bmp]) => buildBmpRow(id, bmp)).join("");
  return `DWL\tBMP\t\r\n` + linhas + `END\tBMP\t\r\n`;
}

// Exportados só pra teste — o formato é o tipo de coisa que só se confirma
// comparando caractere a caractere com uma captura do software oficial.
export const __wire = { to42, to44, to48, empacotarLinhas };
