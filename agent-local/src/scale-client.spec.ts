import { encodePrice } from "./scale-client";

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
});
