/**
 * Geometria da rotulagem nutricional frontal ("ALTO EM ..."), conforme o
 * **Anexo XVIII da IN 75/2020 da ANVISA** — "Requisitos específicos para
 * formatação da rotulagem nutricional frontal".
 *
 * A norma define tudo em cima de duas medidas de referência, não em
 * milímetros absolutos:
 *
 *   Y = altura da letra "A" do texto "ALTO EM"
 *   Z = largura da letra "I" do texto "SÓDIO"
 *
 * e a partir delas:
 *
 *   - Módulo (título e nutrientes): altura 3Y, largura 8Y, cantos arredondados
 *   - Borda externa: espessura 1Z, cantos arredondados, margem interna 2Z
 *   - Distância entre blocos informativos: 2Z
 *   - Lupa: círculo de diâmetro 1,7Y e espessura 1,4Z; cabo de comprimento
 *     1,3Y e espessura 2,6Z, inclinado 30°; conexão de 1,2Z x 1,2Z,
 *     espessura 1,5Z; a 1Z da borda do bloco "ALTO EM"
 *   - Tipografia: Arial Narrow, negrito, caixa alta. "ALTO EM" em preto
 *     sobre branco; nutrientes em branco sobre preto, centralizados
 *
 * O que NÃO dá pra cumprir ao pé da letra aqui, e por quê:
 *
 *   - **Fonte**: a impressora é térmica monocromática e não temos Arial
 *     Narrow embarcada; usamos a 5x7 embutida (`selos-bitmap.ts`), que é o
 *     traço mais próximo disponível sem dependência externa.
 *   - **Tamanho em pontos**: a norma escalona a fonte pela área do painel
 *     principal (9-15pt). Numa etiqueta de balança quem manda é a caixa que
 *     o usuário desenhou no layout, então derivamos Y do espaço disponível.
 *   - **Largura fixa de 8Y por módulo**: se o rótulo não couber (a nossa
 *     fonte é mais larga que Arial Narrow), o módulo cresce o necessário —
 *     texto cortado seria pior que um módulo fora de proporção.
 *
 * Fonte: https://www.gov.br/anvisa/pt-br/assuntos/alimentos/rotulagem/rotulagem-nutricional
 */

/** Proporções do Anexo XVIII, em múltiplos de Y (altura da letra) e Z (traço). */
export const ANVISA = {
  /** Altura do módulo, em Y. */
  moduloAlturaY: 3,
  /** Largura nominal do módulo, em Y. */
  moduloLarguraY: 8,
  /** Espessura da borda externa, em Z. */
  bordaEspessuraZ: 1,
  /** Margem interna da borda externa, em Z. */
  margemInternaZ: 2,
  /** Distância entre blocos informativos, em Z. */
  entreBlocosZ: 2,
  /** Diâmetro do círculo da lupa, em Y. */
  lupaDiametroY: 1.7,
  /** Espessura do traço do círculo, em Z. */
  lupaEspessuraZ: 1.4,
  /** Comprimento do cabo, em Y. */
  cabaoComprimentoY: 1.3,
  /** Espessura do cabo, em Z. */
  caboEspessuraZ: 2.6,
  /** Inclinação do cabo, em graus. */
  caboInclinacaoGraus: 30,
  /** Distância da lupa à borda do bloco "ALTO EM", em Z. */
  lupaAteBlocoZ: 1,
} as const;

/** Os três rótulos previstos na norma, no texto exato. */
export const ROTULOS_ANVISA = {
  acucar: "AÇÚCAR ADICIONADO",
  gordura: "GORDURA SATURADA",
  sodio: "SÓDIO",
} as const;

/**
 * O cadastro do PesoHub é texto livre, então o mesmo selo chega escrito de
 * várias formas ("Açucar Adicionada", "acucar adicionado", "SODIO"...).
 * Normaliza pro texto exato da norma; o que não reconhecemos passa direto,
 * porque é melhor imprimir o que o usuário escreveu do que descartar.
 */
export function rotuloOficial(selo: string): string {
  const chave = selo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (chave.startsWith("ACUCAR")) return ROTULOS_ANVISA.acucar;
  if (chave.startsWith("GORDURA")) return ROTULOS_ANVISA.gordura;
  if (chave.startsWith("SODIO")) return ROTULOS_ANVISA.sodio;
  return selo;
}

/** Ordem em que a norma apresenta os nutrientes. */
const ORDEM = [ROTULOS_ANVISA.acucar, ROTULOS_ANVISA.gordura, ROTULOS_ANVISA.sodio];

/** Ordena os selos como na norma, mantendo desconhecidos no fim. */
export function ordenarSelos(selos: string[]): string[] {
  const rotulados = selos.map(rotuloOficial);
  const conhecidos = ORDEM.filter((r) => rotulados.includes(r));
  const outros = rotulados.filter((r) => !ORDEM.includes(r as (typeof ORDEM)[number]));
  return [...conhecidos, ...outros];
}
