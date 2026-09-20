import {
  ALTURA_ROLO_MM,
  avisoLayoutVsRolo,
  etiquetasFisicasOcupadas,
} from "../lib/papel-etiqueta";

/**
 * Cards #60/#49: o LAB 22 de 120mm ocupava três etiquetas do rolo.
 * Sem esta conta o editor volta a aceitar 120mm em silêncio.
 */
describe("rolo de etiqueta da loja", () => {
  it("cabe em uma etiqueta quando a altura é a do rolo", () => {
    expect(etiquetasFisicasOcupadas(ALTURA_ROLO_MM)).toBe(1);
    expect(avisoLayoutVsRolo(ALTURA_ROLO_MM)).toBeNull();
  });

  it("o layout de 120mm que imprimia cortado ocupa três etiquetas", () => {
    expect(etiquetasFisicasOcupadas(120)).toBe(3);
    expect(avisoLayoutVsRolo(120)).toMatch(/3 etiquetas/);
  });
});
