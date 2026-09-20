/**
 * Tamanho do rolo na loja (cards #60 e #49).
 *
 * Não foi palpite de largura: o LAB 22 de 120mm imprimia em três etiquetas
 * físicas. 120 / 3 = 40mm de altura. A largura imprimível 56mm é a que os
 * modelos de fábrica "60x40" já usam no cabeçalho LAB — encolher o layout de
 * 120mm para 56mm, na época, piorou o corte porque o problema era a altura,
 * não a caixa.
 */
export const LARGURA_IMPRIMIVEL_MM = 56;
export const ALTURA_ROLO_MM = 40;

/** Quantas etiquetas físicas um layout desta altura ocupa no rolo da loja. */
export function etiquetasFisicasOcupadas(alturaLayoutMm: number): number {
  if (!Number.isFinite(alturaLayoutMm) || alturaLayoutMm <= 0) return 1;
  return Math.max(1, Math.ceil(alturaLayoutMm / ALTURA_ROLO_MM));
}

/** Texto do aviso, ou null quando o layout cabe em uma etiqueta. */
export function avisoLayoutVsRolo(alturaLayoutMm: number): string | null {
  const n = etiquetasFisicasOcupadas(alturaLayoutMm);
  if (n <= 1) return null;
  return `O rolo da loja tem ${ALTURA_ROLO_MM}mm de altura. Este layout de ${alturaLayoutMm}mm imprime em ${n} etiquetas.`;
}
