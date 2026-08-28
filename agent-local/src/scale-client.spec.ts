import { encodePrice, encodeTara } from "./scale-client";

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
