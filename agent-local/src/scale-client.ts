import { Socket } from "net";

export interface TabelaNutricionalItemPayload {
  /** Posição do nutriente no formulário (1-based). 1-10 mapeiam pros 10 slots
   * padrão do wire (valor energético, carboidratos, ..., sódio); acima de 10
   * viram nutrientes extras (nome + valor + %VD), até 10 slots extras (ordem 11-20). */
  ordem: number;
  valor: number;
  porcentagem?: number;
  /** Só usado nos slots extras (ordem > 10) — os 10 padrão não levam nome no wire. */
  ingrediente?: string;
}

export interface TabelaNutricionalPayload {
  /** Índice sequencial da tabela na balança (mesmo namespace do `PLU_NUMBER`,
   * referenciado pelo campo de vínculo do PLU — ver FIELD_VINCULO_TABELA_NUTRICIONAL). */
  numero: number;
  nome: string;
  porcao?: string;
  porcoesPorEmbalagem?: number;
  itens: TabelaNutricionalItemPayload[];
}

export interface FormatoImpressaoElementoPayload {
  x: number;
  y: number;
  largura: number;
  altura: number;
  /** Angle/Align/Font do wire (`LabelItem`) — ver ressalva de mapeamento
   * ainda não confirmado visualmente em `scale-client.ts` (buildLabelBlock). */
  angulo?: number;
  alinhamento?: number;
  fonte?: number;
}

export interface FormatoImpressaoPayload {
  /** Mesmo esquema de "número" que TabelaNutricional usa — vira o `LabelID`
   * do wire (comando `DWL/LAB`), referenciado pelo vínculo idx8 do PLU. */
  numero: number;
  nome: string;
  larguraMm: number;
  alturaMm: number;
  elementos: FormatoImpressaoElementoPayload[];
}

export interface ScaleSyncPayload {
  codigo: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  categoriaImposto?: string;
  /** `UnitID` no código-fonte decompilado — idx4 do PLU. Unidade de venda
   * (peso/unidade), não "bandeira de código de barras" como se suspeitava
   * antes. Mapeamento PESO/PECA→1/2 ainda sujeito a confirmação de hardware
   * (só o valor "1" tinha sido visto em registros reais até agora). */
  unidadeVenda?: "PESO" | "PECA";
  /** Modo de cálculo do imposto na balança (TaxType do wire): 1=soma por fora
   * do preço, 2=informativo (não altera o preço), 3=embutido no preço
   * (extrai). Ausente/0 = sem imposto. */
  taxType?: number;
  /** Alíquota em %, ex.: 18 para 18%. Convertida para o inteiro do wire
   * (percentual × 10000) em `buildPluRow`. */
  taxaImposto?: number;
  tara?: number;
  desconto?: number;
  textoExtra1?: string;
  textoExtra2?: string;
  textoExtra3?: string;
  textoExtra4?: string;
  textoExtra5?: string;
  textoExtra6?: string;
  textoExtra7?: string;
  validadeDias?: number;
  formatoImpressao?: FormatoImpressaoPayload;
  tabelaNutricional?: TabelaNutricionalPayload;
}

export interface ScaleSyncOutcome {
  ok: boolean;
  erro?: string;
  itensProcessados?: number;
}

/**
 * Template de um registro PLU real capturado da balança (69 campos tab-separated,
 * ver [[ramuza-scale-protocol]] na memória do projeto). Os campos não decodificados
 * (tabela nutricional, fornecedor, formato de etiqueta, etc.) são replicados como
 * a balança/software oficial os enviou — só os índices abaixo são substituídos
 * por produto: 1 (número PLU), 2 (código), 3 (EAN13/endereço), 5 (preço),
 * 7 (tara, kg), 15 (nome), 16 (texto extra 1), 32 (validade em dias),
 * 56 (desconto/preço promocional).
 *
 * IMPORTANTE: o campo 2 (código) só é aceito se for numérico — testado
 * empiricamente em 2026-08-25 contra a balança física: um código alfanumérico
 * faz a balança descartar o PLU inteiro em silêncio (sem erro no protocolo).
 *
 * Campos 16/32/56 confirmados via captura Wireshark real do software oficial
 * Ramuza (2026-08-26) — ver [[project_scale_protocol_field_gap]]. Fornecedor/
 * formato de etiqueta/etc. ainda NÃO vão embutidos aqui. A tabela nutricional
 * tem um comando de protocolo próprio (`DWL/NU3`, ver `buildNu3Row` abaixo) —
 * o campo 59 do PLU só guarda o VÍNCULO (índice da tabela), confirmado via
 * captura controlada em 2026-08-27 (mudar o número da tabela de 1→2 mudou
 * exatamente o idx59 do PLU de "1"→"2", nada mais).
 *
 * ATENÇÃO — 2026-08-27, hardware físico (192.168.15.5): o VÍNCULO (idx59 do
 * PLU) persiste normalmente ao escrever via este cliente, mas o `DWL/NU3` em
 * si NÃO PERSISTIU em três tentativas (tabela nova, sobrescrita de tabela
 * existente, e até um replay byte-a-byte do registro exato capturado do
 * software oficial) — a balança aceita a conexão e não retorna erro, mas o
 * conteúdo simplesmente não aparece depois num `UPL/NU3`. O software oficial
 * deve fazer algo mais antes/durante que não foi replicado aqui (handshake,
 * comando de config, ou uma sequência de verbos ainda não identificada) — ver
 * [[project_scale_protocol_field_gap]] antes de confiar em `buildNu3Row` pra
 * qualquer coisa além de referência/leitura do formato. Os campos 19/20/22 (textos
 * extras adicionais), 27 e 65 (candidatos incertos) também mudaram em capturas
 * anteriores mas sem confiança suficiente pra mapear — não usar sem uma nova
 * captura mais controlada.
 */
const PLU_FIELD_TEMPLATE = [
  "PLU", "999", "1010", "", "1", "5,0", "0,0", "0,0", "0", "0", "0", "0", "0", "0", "9",
  "TESTE", "", "", "", "", "", "", "", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",
  "0", "0", "0,0", "0,0", "0", "127", "0,0", "0,0", "0,0", "0", "127", "0,0", "0,0", "0,0",
  "0", "127", "0,0", "0,0", "0,0", "0", "127", "0,0", "0,0", "0,0", "0", "0", "0", "0", "0",
  "0", "0", "teste", "0", "0", "0", "",
];

const FIELD_PLU_NUMBER = 1;
const FIELD_PRODUCT_CODE = 2;
const FIELD_EAN13 = 3;
const FIELD_UNIT = 4;
const UNIDADE_VENDA_WIRE: Record<"PESO" | "PECA", string> = { PESO: "1", PECA: "2" };
const FIELD_PRICE = 5;
const FIELD_TARA = 7;
/** `LabelID1` no código-fonte decompilado do Ramuza.exe — vínculo com o
 * formato de etiqueta (mesmo namespace de "número" que FormatoImpressao usa
 * no PesoHub). Não confirmado ainda em hardware físico — ver
 * [[project_ramuza_full_field_map_2026_08_28]] antes de assumir certo. */
const FIELD_VINCULO_FORMATO_IMPRESSAO = 8;
const FIELD_NAME = 15;
/** Text1-7 no código-fonte decompilado — idx16-22 do PLU. Confirmado por
 * `RDS.DataSet_GetPLUString`/`DataSet_GetPLURowFromTMS`, ver
 * [[project_ramuza_full_field_map_2026_08_28]]. Só idx16 (Text1) tinha sido
 * confirmado empiricamente antes; idx17-22 (Text2-7) nunca tinham sido
 * wired — não confundir com os "candidatos incertos" de captura antiga
 * mencionados acima, esse mapeamento vem direto do código-fonte. */
const FIELD_TEXTO_EXTRA_1 = 16;
const FIELD_TEXTO_EXTRA_2 = 17;
const FIELD_TEXTO_EXTRA_3 = 18;
const FIELD_TEXTO_EXTRA_4 = 19;
const FIELD_TEXTO_EXTRA_5 = 20;
const FIELD_TEXTO_EXTRA_6 = 21;
const FIELD_TEXTO_EXTRA_7 = 22;
const FIELD_VALIDADE_DIAS = 32;
const FIELD_DESCONTO = 56;
/** TaxType/Tax no código-fonte decompilado — idx57/58 do PLU. Semântica achada
 * em `RDS.cs` (lógica de venda, não uma tabela de códigos): TaxType 1=soma o
 * imposto por fora do preço, 2=calcula só como informativo (não altera o
 * preço cobrado), 3=imposto já embutido no preço (extrai a parte do
 * imposto); qualquer outro valor = sem imposto. Tax é a alíquota como
 * inteiro = percentual × 10000 (ex.: 18% → 1800). Ver
 * [[project_ramuza_full_field_map_2026_08_28]]. */
const FIELD_TAX_TYPE = 57;
const FIELD_TAX = 58;
const FIELD_VINCULO_TABELA_NUTRICIONAL = 59;

/**
 * Template de um registro NU3 (tabela nutricional) capturado da balança
 * (2026-08-27, ver [[project_scale_protocol_field_gap]]): idx1 índice da
 * tabela, idx2 nome, idx4/5 porção (quantidade/unidade), idx6 porções por
 * embalagem, idx7-26 os 10 nutrientes padrão em pares (valor, %VD) — valor
 * energético, carboidratos, açúcares totais, açúcares adicionados, proteínas,
 * gorduras totais, gorduras saturadas, gorduras trans, fibra alimentar, sódio
 * — nessa ordem fixa — e idx27-56 dez grupos de 3 (nome, valor, %VD) pra
 * nutrientes extras além dos 10 padrão.
 *
 * O idx57 final é um campo VAZIO obrigatório (o registro termina com tab antes
 * do CRLF, igual ao PLU). Faltava aqui até 2026-08-28 e era a causa raiz da
 * não-persistência do NU3: a balança dava ACK normal e descartava o registro em
 * silêncio por vir com 57 campos em vez de 58 — mesma classe de bug do descarte
 * silencioso do PLU por código não-numérico. Confirmado por diff campo a campo
 * contra uma escrita real do software oficial que persistiu (única diferença
 * entre as duas linhas era este campo). Ver [[project_scale_protocol_field_gap]].
 */
const NU3_FIELD_TEMPLATE = [
  "NU3", "0", "", "", "0", "", "",
  "0,0", "0,0", "0,0", "0,0", "0,0", "0,0", "0,0", "0,0", "0,0", "0,0",
  "0,0", "0,0", "0,0", "0,0", "0,0", "0,0", "0,0", "0,0", "0,0", "0,0",
  "", "0,0", "0,0", "", "0,0", "0,0", "", "0,0", "0,0", "", "0,0", "0,0",
  "", "0,0", "0,0", "", "0,0", "0,0", "", "0,0", "0,0", "", "0,0", "0,0",
  "", "0,0", "0,0", "", "0,0", "0,0",
  "",
];
const NU3_FIELD_INDEX = 1;
const NU3_FIELD_NOME = 2;
const NU3_FIELD_PORCAO_QTD = 4;
const NU3_FIELD_PORCAO_UNIDADE = 5;
const NU3_FIELD_PORCOES_POR_EMBALAGEM = 6;
const NU3_NUTRIENTES_PADRAO = 10;
const NU3_FIRST_PADRAO_FIELD = 7; // par (valor, %VD) por nutriente padrão, 2 campos cada
const NU3_FIRST_EXTRA_GROUP_FIELD = 27; // trio (nome, valor, %VD) por nutriente extra, 3 campos cada
const NU3_MAX_EXTRA_ITENS = 10;

/**
 * Codifica um preço (em reais) no formato compacto da balança: "<mantissa>,<casasDecimais>",
 * onde valor = mantissa / 10^casasDecimais, com a mantissa mínima (sem zeros à direita) —
 * é exatamente o que o software oficial emite (confirmado por captura A/B: R$1,11→"111,2",
 * R$1,50→"15,1", R$5,00→"5,0").
 */
export function encodePrice(reais: number): string {
  let cents = Math.round(reais * 100);
  let decimals = 2;
  while (decimals > 0 && cents % 10 === 0) {
    cents /= 10;
    decimals--;
  }
  return `${cents},${decimals}`;
}

/**
 * Mesma codificação compacta "<mantissa>,<casasDecimais>" do preço, mas para
 * tara (kg, 3 casas — confirmado empiricamente em 2026-08-25 contra a balança
 * física: escrever "550,2" no campo 7 do PLU fez a tela mostrar TARA=5.500kg).
 */
export function encodeTara(kg: number): string {
  let grams = Math.round(kg * 1000);
  let decimals = 3;
  while (decimals > 0 && grams % 10 === 0) {
    grams /= 10;
    decimals--;
  }
  return `${grams},${decimals}`;
}

const PLU_NUMBER_MIN = 1;
const PLU_NUMBER_MAX = 10_000;

/**
 * A balança numera PLUs de 1 a 10000 (ver manual, 3.3 - PLU). O backend não tem
 * um número de PLU dedicado — usa `codigo` como string livre. Se `codigo` for
 * numérico e couber nesse range, reaproveitamos ele (mantém o mesmo produto
 * sempre no mesmo slot da balança entre syncs); caso contrário caímos para a
 * posição do produto na lista enviada.
 */
function resolvePluNumber(codigo: string, indexInBatch: number): number {
  const parsed = Number(codigo);
  if (Number.isInteger(parsed) && parsed >= PLU_NUMBER_MIN && parsed <= PLU_NUMBER_MAX) {
    return parsed;
  }
  return indexInBatch + 1;
}

/**
 * O protocolo da balança delimita campos por TAB e linhas por CRLF. Um valor
 * malicioso contendo esses caracteres poderia forjar campos/linhas extras no
 * stream enviado ao hardware, então removemos qualquer TAB/CR/LF antes de
 * montar a linha.
 */
function sanitizeField(value: string): string {
  return value.replace(/[\t\r\n]/g, "");
}

/**
 * A balança REJEITA EM SILÊNCIO o registro PLU inteiro se o campo código
 * (índice 2) não for puramente numérico — confirmado empiricamente em
 * 2026-08-25 contra a balança física (nenhum erro no protocolo, o PLU
 * simplesmente não aparece no dump de UPL/PLU). Como `codigo` no PesoHub é
 * texto livre, quando não for numérico caímos para o número do PLU (que já é
 * garantidamente numérico) em vez de perder o produto silenciosamente.
 */
function resolveWireCodigo(codigo: string, pluNumber: number): string {
  return /^\d+$/.test(codigo) ? codigo : String(pluNumber);
}

/**
 * A balança quer a porção como dois campos separados (quantidade + unidade),
 * mas o PesoHub guarda como texto livre (ex.: "40g", "40 g", "1 fatia").
 * Extrai o número inicial como quantidade; o resto (sem espaços nas pontas)
 * vira a unidade. Se não houver número no início, manda tudo como unidade.
 */
function parsePorcao(porcao: string): { quantidade: string; unidade: string } {
  const match = porcao.match(/^\s*(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return { quantidade: "", unidade: sanitizeField(porcao.trim()) };
  return { quantidade: match[1].replace(".", ","), unidade: sanitizeField(match[2].trim()) };
}

export function buildNu3Row(tabela: TabelaNutricionalPayload): string {
  const fields = [...NU3_FIELD_TEMPLATE];
  fields[NU3_FIELD_INDEX] = String(tabela.numero);
  fields[NU3_FIELD_NOME] = sanitizeField(tabela.nome);
  if (tabela.porcao != null) {
    const { quantidade, unidade } = parsePorcao(tabela.porcao);
    fields[NU3_FIELD_PORCAO_QTD] = quantidade;
    fields[NU3_FIELD_PORCAO_UNIDADE] = unidade;
  }
  if (tabela.porcoesPorEmbalagem != null) {
    fields[NU3_FIELD_PORCOES_POR_EMBALAGEM] = String(Math.round(tabela.porcoesPorEmbalagem));
  }

  for (const item of tabela.itens) {
    if (item.ordem >= 1 && item.ordem <= NU3_NUTRIENTES_PADRAO) {
      const base = NU3_FIRST_PADRAO_FIELD + (item.ordem - 1) * 2;
      fields[base] = encodePrice(item.valor);
      if (item.porcentagem != null) fields[base + 1] = encodePrice(item.porcentagem);
    } else if (item.ordem > NU3_NUTRIENTES_PADRAO && item.ordem <= NU3_NUTRIENTES_PADRAO + NU3_MAX_EXTRA_ITENS) {
      const base = NU3_FIRST_EXTRA_GROUP_FIELD + (item.ordem - NU3_NUTRIENTES_PADRAO - 1) * 3;
      fields[base] = sanitizeField(item.ingrediente ?? "");
      fields[base + 1] = encodePrice(item.valor);
      if (item.porcentagem != null) fields[base + 2] = encodePrice(item.porcentagem);
    }
    // ordem > 20: a balança não tem mais slots pra nutrientes extras — ignorado.
  }

  return fields.join("\t") + "\r\n";
}

export function buildPluRow(product: ScaleSyncPayload, pluNumber: number): string {
  const fields = [...PLU_FIELD_TEMPLATE];
  fields[FIELD_PLU_NUMBER] = String(pluNumber);
  fields[FIELD_PRODUCT_CODE] = sanitizeField(resolveWireCodigo(product.codigo, pluNumber));
  fields[FIELD_EAN13] = sanitizeField(product.codigoBarras ?? "");
  if (product.unidadeVenda != null) fields[FIELD_UNIT] = UNIDADE_VENDA_WIRE[product.unidadeVenda];
  fields[FIELD_PRICE] = encodePrice(product.preco);
  if (product.tara != null) fields[FIELD_TARA] = encodeTara(product.tara);
  if (product.desconto != null) fields[FIELD_DESCONTO] = encodePrice(product.desconto);
  if (product.textoExtra1 != null) fields[FIELD_TEXTO_EXTRA_1] = sanitizeField(product.textoExtra1);
  if (product.textoExtra2 != null) fields[FIELD_TEXTO_EXTRA_2] = sanitizeField(product.textoExtra2);
  if (product.textoExtra3 != null) fields[FIELD_TEXTO_EXTRA_3] = sanitizeField(product.textoExtra3);
  if (product.textoExtra4 != null) fields[FIELD_TEXTO_EXTRA_4] = sanitizeField(product.textoExtra4);
  if (product.textoExtra5 != null) fields[FIELD_TEXTO_EXTRA_5] = sanitizeField(product.textoExtra5);
  if (product.textoExtra6 != null) fields[FIELD_TEXTO_EXTRA_6] = sanitizeField(product.textoExtra6);
  if (product.textoExtra7 != null) fields[FIELD_TEXTO_EXTRA_7] = sanitizeField(product.textoExtra7);
  if (product.validadeDias != null) fields[FIELD_VALIDADE_DIAS] = String(Math.round(product.validadeDias));
  if (product.taxType != null && product.taxType >= 1 && product.taxType <= 3) {
    fields[FIELD_TAX_TYPE] = String(product.taxType);
    fields[FIELD_TAX] = String(Math.round((product.taxaImposto ?? 0) * 10000));
  }
  if (product.formatoImpressao != null) {
    fields[FIELD_VINCULO_FORMATO_IMPRESSAO] = String(product.formatoImpressao.numero);
  }
  if (product.tabelaNutricional != null) {
    fields[FIELD_VINCULO_TABELA_NUTRICIONAL] = String(product.tabelaNutricional.numero);
  }
  fields[FIELD_NAME] = sanitizeField(product.nome);
  return fields.join("\t") + "\r\n";
}

/**
 * Monta o bloco `LAB\t...` (cabeçalho do formato de etiqueta) + um `LAS\t...`
 * por elemento posicionado + `LAE\t` de fechamento, achado em
 * `NetForm.cs`/`UploadECS()` (bloco `checkPara.blabel`, ramo `iScaleType_TM`
 * — que é exatamente o tipo do nosso hardware, Ramuza Atena II TM-xA) do
 * código-fonte decompilado. Ver [[project_ramuza_full_field_map_2026_08_28]].
 *
 * NÃO CONFIRMADO EM HARDWARE FÍSICO ainda — os 32 campos de texto fixo
 * (Text1-32) do cabeçalho LAB não têm equivalente no PesoHub hoje (ficam
 * vazios), e os campos Flag1-3 de cada elemento (LAS) continuam com valor
 * neutro (0) até descobrir o que fazem. `Print=1` (assume "sempre imprime").
 * O fator de conversão de mm pra unidade do wire também é uma suposição
 * (1:1) — testar contra a balança antes de confiar cegamente na
 * posição/tamanho impresso.
 *
 * Angle/Align/Font (2026-08-29): write→readback confirmado no protocolo
 * (`probe-lab-angle-align-font.ts`), mas o MAPEAMENTO em si (que valor de
 * Angle corresponde a qual rotação visual, etc.) é uma suposição —
 * `angulo` em graus (0/90/180/270) vira índice de giro de 90° (0-3),
 * `alinhamento`/`fonte` são passados como inteiro cru. Nunca foi impresso
 * fisicamente numa etiqueta pra confirmar o efeito visual real.
 */
function buildLabelBlock(formato: FormatoImpressaoPayload): string {
  const emptyTexts = new Array(32).fill("");
  const header =
    [
      "LAB",
      String(formato.numero),
      sanitizeField(formato.nome),
      "0", // Sort
      String(Math.round(formato.larguraMm)),
      String(Math.round(formato.alturaMm)),
      ...emptyTexts.slice(0, 16), // Text1-16
      "0", // Version
      ...emptyTexts.slice(16, 32), // Text17-32
    ].join("\t") + "\t\r\n";

  const elementos = formato.elementos
    .map((el, i) =>
      [
        "LAS",
        String(i + 1), // SubID
        "0", // Flag1
        "0", // Flag2
        "0", // Flag3
        "1", // Print
        String(Math.round(((el.angulo ?? 0) / 90) % 4)), // Angle (índice de giro de 90°)
        String(el.alinhamento ?? 0), // Align
        String(el.fonte ?? 0), // Font
        String(Math.round(el.x)),
        String(Math.round(el.y)),
        String(Math.round(el.largura)),
        String(Math.round(el.altura)),
      ].join("\t") + "\t\r\n",
    )
    .join("");

  return header + elementos + "LAE\t\r\n";
}

/**
 * Monta o corpo DWL/PLU(+NU3)/UPL-TIM pra um lote de produtos — extraído de
 * `sendProductsToScale` pra ser reaproveitado tanto pela conexão efêmera
 * (probes, compat) quanto pela conexão persistente (`ScaleConnection`, ver
 * scale-connection.ts) usada em produção pelo agent-local.
 */
export function buildSyncBody(products: ScaleSyncPayload[]): string {
  const pluNumbers = products.map((p, i) => resolvePluNumber(p.codigo, i));

  // Dedupe por número da tabela: vários produtos podem apontar pra mesma
  // tabela nutricional, e a balança só precisa receber cada NU3 uma vez
  // (visto na captura oficial: DWL/NU3 vem uma vez só, com todas as
  // tabelas relevantes, não uma vez por produto).
  const tabelasNutricionais = new Map<number, TabelaNutricionalPayload>();
  for (const p of products) {
    if (p.tabelaNutricional != null) {
      tabelasNutricionais.set(p.tabelaNutricional.numero, p.tabelaNutricional);
    }
  }

  const nu3Block =
    tabelasNutricionais.size > 0
      ? `DWL\tNU3\t\r\n` + [...tabelasNutricionais.values()].map(buildNu3Row).join("") + `END\tNU3\t\r\n`
      : "";

  // Mesmo dedupe do NU3: vários produtos podem compartilhar o mesmo formato
  // de etiqueta.
  const formatosImpressao = new Map<number, FormatoImpressaoPayload>();
  for (const p of products) {
    if (p.formatoImpressao != null) {
      formatosImpressao.set(p.formatoImpressao.numero, p.formatoImpressao);
    }
  }

  const labBlock =
    formatosImpressao.size > 0
      ? `DWL\tLAB\t\r\n` + [...formatosImpressao.values()].map(buildLabelBlock).join("") + `END\tLAB\t\r\n`
      : "";

  return (
    `DWL\tPLU\t\r\n` +
    products.map((p, i) => buildPluRow(p, pluNumbers[i])).join("") +
    `END\tPLU\t\r\n` +
    nu3Block +
    labBlock +
    `UPL\tTIM\t\r\n`
  );
}

/**
 * Cliente TCP real para a balança Ramuza/Atena (protocolo TXT-MODE, porta 33581).
 * Handshake replicado do que o software oficial faz ao clicar "Download" na tela
 * Ethernet: envia o bloco DWL/PLU/END com os produtos, pede sincronismo de hora
 * (UPL TIM) e fecha a sessão com UPL END. Ver [[ramuza-scale-protocol]].
 *
 * ATENÇÃO — 2026-08-27: esta função abre e fecha uma conexão nova a cada
 * chamada. Uma captura Wireshark real (`captura06.json`, ver
 * [[project_scale_protocol_field_gap]]) mostrou que a única escrita `DWL/NU3`
 * confirmada como persistida veio de uma conexão que ficou aberta ~28 minutos,
 * com bastante atividade real antes da escrita do NU3 — uma conexão nova e
 * efêmera como esta NUNCA conseguiu persistir o conteúdo do NU3 em nenhum dos
 * 22+ testes feitos. Pra produção, usar `ScaleConnection`
 * (scale-connection.ts), que mantém uma conexão persistente por dispositivo.
 * Esta função continua existindo pra compat com os scripts `probe-*.ts`.
 */
export async function sendProductsToScale(
  ip: string,
  port: number,
  products: ScaleSyncPayload[],
): Promise<ScaleSyncOutcome> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(10_000);
    socket.setEncoding("latin1");

    let buffer = "";
    let closed = false;

    const finish = (outcome: ScaleSyncOutcome) => {
      if (closed) return;
      closed = true;
      socket.destroy();
      resolve(outcome);
    };

    socket.connect(port, ip, () => {
      socket.write(buildSyncBody(products), "latin1");
    });

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      if (buffer.includes("END\tTIM")) {
        socket.write("UPL\tEND\t\r\n", "latin1", () => {
          finish({ ok: true, itensProcessados: products.length });
        });
      }
    });

    socket.on("timeout", () => {
      finish({ ok: false, erro: `Timeout ao comunicar com a balança em ${ip}:${port}.` });
    });

    socket.on("error", (err) => {
      finish({ ok: false, erro: `Falha de comunicação TCP com a balança: ${err.message}` });
    });

    socket.on("close", () => {
      finish({ ok: false, erro: "Conexão encerrada pela balança antes de confirmar o envio." });
    });
  });
}
