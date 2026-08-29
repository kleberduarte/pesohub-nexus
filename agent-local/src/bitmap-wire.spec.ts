import { buildBmpRow, buildBmpBlock, __wire, type BitmapMonocromatico } from "./bitmap-wire";

const { to42, to44, to48, empacotarLinhas } = __wire;

describe("encoding to42/to44/to48", () => {
  it("codifica cada byte como dois nibbles somados a 64", () => {
    // Program.To42 no software oficial: (char)(64 + b/16) + (char)(64 + b%16)
    expect(to42(0x00)).toBe("@@");
    expect(to42(0xff)).toBe("OO");
    expect(to42(0x1a)).toBe("AJ"); // 1 -> 'A' (65), 10 -> 'J' (74)
  });

  it("usa little-endian em to44/to48", () => {
    expect(to44(0x1234)).toBe(to42(0x34) + to42(0x12));
    expect(to48(0x12345678)).toBe(to42(0x78) + to42(0x56) + to42(0x34) + to42(0x12));
  });

  it("nunca sai da faixa @-O (mantém o payload livre de tab/CR)", () => {
    for (let b = 0; b <= 0xff; b++) {
      for (const ch of to42(b)) {
        expect(ch.charCodeAt(0)).toBeGreaterThanOrEqual(64);
        expect(ch.charCodeAt(0)).toBeLessThanOrEqual(79);
      }
    }
  });
});

describe("empacotarLinhas", () => {
  it("põe o pixel mais à esquerda no bit mais significativo", () => {
    const bmp: BitmapMonocromatico = {
      largura: 8,
      altura: 1,
      pixels: Uint8Array.from([1, 0, 0, 0, 0, 0, 0, 1]),
    };
    expect([...empacotarLinhas(bmp)]).toEqual([0b10000001]);
  });

  it("arredonda a linha pra byte cheio quando a largura não é múltipla de 8", () => {
    const bmp: BitmapMonocromatico = {
      largura: 9,
      altura: 2,
      pixels: new Uint8Array(18).fill(1),
    };
    // 2 bytes por linha x 2 linhas; o bit sobrando fica zerado
    const out = empacotarLinhas(bmp);
    expect(out.length).toBe(4);
    expect([...out]).toEqual([0xff, 0x80, 0xff, 0x80]);
  });
});

describe("buildBmpRow", () => {
  const bmp: BitmapMonocromatico = { largura: 8, altura: 1, pixels: new Uint8Array(8).fill(1) };

  it("monta a linha no formato BMP\\t<id>\\t<payload>\\t", () => {
    const row = buildBmpRow(3, bmp);
    expect(row.startsWith("BMP\t3\t")).toBe(true);
    expect(row.endsWith("\t\r\n")).toBe(true);
  });

  it("repete o id, as dimensões e os 176 chars de cabeçalho reservado", () => {
    const payload = buildBmpRow(3, bmp).split("\t")[2];
    expect(payload.startsWith(to48(3) + to44(8) + to44(1) + "@".repeat(176))).toBe(true);
  });

  it("termina com os bytes do bitmap (linha cheia = 0xFF)", () => {
    const payload = buildBmpRow(3, bmp).split("\t")[2];
    expect(payload.slice(-2)).toBe(to42(0xff));
  });
});

describe("buildBmpBlock", () => {
  const bmp: BitmapMonocromatico = { largura: 8, altura: 1, pixels: new Uint8Array(8).fill(1) };

  it("não emite bloco quando não há imagem", () => {
    expect(buildBmpBlock(new Map())).toBe("");
  });

  it("envolve as linhas em DWL/BMP ... END/BMP", () => {
    const bloco = buildBmpBlock(new Map([[1, bmp]]));
    expect(bloco.startsWith("DWL\tBMP\t\r\n")).toBe(true);
    expect(bloco.endsWith("END\tBMP\t\r\n")).toBe(true);
  });
});
