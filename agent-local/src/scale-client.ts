import { Socket } from "net";
import { buildBmpBlock, type BitmapMonocromatico } from "./bitmap-wire";
import { desenharFaixaSelos, atribuirIdsDeSelo } from "./selos-bitmap";

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
  /** Vai no campo de texto livre do próprio NU3 (ver `NU3_FIELD_INGREDIENTES`). */
  ingredientes?: string;
  /** Selos de advertência ("ALTO EM açúcar", ...). Na balança não existe um
   * cadastro de "selo": o equivalente nativo é o bloco `IR2` ("Alérgicos"),
   * que é um registro de advertência com Nome + Informação, referenciado
   * pelo idx61 do PLU. Ver `buildAlergicoRow`. */
  selos?: string[];
  itens: TabelaNutricionalItemPayload[];
}

export interface FormatoImpressaoElementoPayload {
  /** Tipo do elemento no editor visual (`nome`/`preco`/`codigoBarras`/etc,
   * ver `ElementoTipo` em `EtiquetaPreview.tsx`) — decide a tripla
   * Flag1/Flag2/Flag3 do wire, ver `FLAG_POR_TIPO`. */
  tipo?: string;
  /** Conteúdo dos elementos `tipo: "texto"` — vira um dos 32 textos
   * constantes do cabeçalho LAB (ver `buildLabelBlock`). */
  texto?: string;
  /** Qual bitmap mostrar nos elementos `tipo: "imagem"` — vai no Flag2 do
   * wire. As imagens são enviadas à parte, no bloco `DWL/BMP`. */
  imagemNumero?: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
  /** Espessura da linha dos elementos `tipo: "borda"`/`"divisoria"`, em
   * pontos. Vai no Flag2 do wire: o `LabelItem.xml` oficial documenta
   * Flag1=4 (Borda) com Flag2 de 1 a 15 sendo a própria espessura. Os
   * modelos de fábrica usam quase só 2 e 15. */
  espessura?: number;
  /** Angle/Align/Font do wire (`LabelItem`) — ver ressalva de mapeamento
   * ainda não confirmado visualmente em `scale-client.ts` (buildLabelBlock). */
  angulo?: number;
  alinhamento?: number;
  fonte?: number;
}

export interface ClassePayload {
  /** Mesmo esquema de "número" que TabelaNutricional/FormatoImpressao usam —
   * vira o `ClassID` do wire (comando `DWL/CLS`), referenciado pelo idx14
   * do PLU. */
  numero: number;
  nome: string;
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
  /** `Cost` no código-fonte decompilado — idx6 do PLU. Só armazenado/enviado
   * pra balança, não usado em cálculo de venda no PesoHub. */
  custo?: number;
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
  /** Setor/departamento do produto — vira `ClassID` (idx14 do PLU). Ausente
   * mantém o "9" neutro do template (mesmo fallback que o software oficial
   * usa quando o PLU não referencia nenhuma Class válida, ver `RDS.cs`). */
  setor?: ClassePayload;
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
const FIELD_COST = 6;
const FIELD_TARA = 7;
/** `ClassID` no código-fonte decompilado — idx14 do PLU. Referencia um
 * cadastro próprio da balança (`Class`, comando `DWL/CLS`), não é um número
 * solto — template mantém "9" (mesmo fallback do software oficial quando o
 * PLU não tem Class válida, ver `RDS.cs` `logItemRow.Class = ... ?? 9`). */
const FIELD_SETOR = 14;
/** 1-9 são ClassIDs reservados pela balança (Diversos-Peso, Taxa de serviço,
 * Padrão etc. — confirmado via `UPL/CLS` no hardware físico em 2026-08-29).
 * O backend já bloqueia `Setor.numero` nessa faixa pra cadastros novos, mas
 * um Setor criado ANTES dessa validação existir ainda pode ter um número
 * baixo — nunca escrever/referenciar uma Class nessa faixa a partir daqui,
 * pra não sobrescrever as classes do sistema. */
const CLASS_ID_MIN_SAFE = 10;
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
/**
 * Flags de "imprimir esta data na etiqueta" — sem elas a balança até guarda
 * o valor, mas nunca imprime. Nomes oficiais vindos de `pw_PLUIE_Display`
 * (`Lang.xml` do software da Ramuza), que documenta o PLU campo a campo:
 * idx23 "Imprimir data de venda", idx25 "Imprimir data de empacotamento",
 * idx27 "Data de validade: 0 p/ não imprimir, 1 p/ imprimir".
 *
 * Era exatamente por isso que a validade não saía na etiqueta mesmo com
 * `validadeDias` gravado corretamente em idx32 (card #30).
 */
const FIELD_IMPRIMIR_DATA_VENDA = 23;
const FIELD_IMPRIMIR_DATA_EMBALAGEM = 25;
const FIELD_IMPRIMIR_VALIDADE = 27;
/** idx32 — "Data de validade: (em dias)" conforme `pw_PLUIE_Display`. Isto
 * encerra a antiga dúvida de que este índice seria `PC_UD` (Price Change —
 * Until Date): a documentação oficial do próprio software confirma que é a
 * validade em dias, como já vínhamos usando. */
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
/** idx60/idx61 — "Fornecedor" e "Alérgicos" conforme `pw_PLUIE_Display`
 * (`Lang.xml` oficial). Apontam pros blocos `SU2` e `IR2`. Só o de alérgico
 * é usado hoje, pros selos "ALTO EM ..." (ver `buildAlergicoRow`). */
const FIELD_VINCULO_FORNECEDOR = 60;
const FIELD_VINCULO_ALERGICO = 61;

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
/** Campo de texto livre do NU3, logo depois do nome. Confirmado vazio em
 * todas as tabelas lidas do hardware via `UPL/NU3`, e o `Custom.xml` do
 * software oficial lista "Ingredientes" como parte do bloco NU3 (não é um
 * cadastro separado como Fornecedor/Alérgicos). */
const NU3_FIELD_INGREDIENTES = 3;
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
  if (tabela.ingredientes) fields[NU3_FIELD_INGREDIENTES] = sanitizeField(tabela.ingredientes);

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

/**
 * Um campo de texto conta como "não usado" tanto quando vem nulo quanto quando
 * vem em branco. O formulário do frontend manda `""` para todo campo opcional
 * que o usuário não preencheu, e `"" == null` é falso em JavaScript — por isso
 * um Texto extra 4 vazio bloqueava a cópia dos ingredientes como se o usuário
 * o tivesse reservado para outra coisa, e a etiqueta saía sem ingredientes.
 */
export function estaEmBranco(valor: string | null | undefined): boolean {
  return valor == null || valor.trim() === "";
}

export function buildPluRow(product: ScaleSyncPayload, pluNumber: number): string {
  const fields = [...PLU_FIELD_TEMPLATE];
  fields[FIELD_PLU_NUMBER] = String(pluNumber);
  fields[FIELD_PRODUCT_CODE] = sanitizeField(resolveWireCodigo(product.codigo, pluNumber));
  fields[FIELD_EAN13] = sanitizeField(product.codigoBarras ?? "");
  if (product.unidadeVenda != null) fields[FIELD_UNIT] = UNIDADE_VENDA_WIRE[product.unidadeVenda];
  fields[FIELD_PRICE] = encodePrice(product.preco);
  if (product.custo != null) fields[FIELD_COST] = encodePrice(product.custo);
  if (product.tara != null) fields[FIELD_TARA] = encodeTara(product.tara);
  if (product.setor != null && product.setor.numero >= CLASS_ID_MIN_SAFE) {
    fields[FIELD_SETOR] = String(product.setor.numero);
  }
  if (product.desconto != null) fields[FIELD_DESCONTO] = encodePrice(product.desconto);
  if (product.textoExtra1 != null) fields[FIELD_TEXTO_EXTRA_1] = sanitizeField(product.textoExtra1);
  if (product.textoExtra2 != null) fields[FIELD_TEXTO_EXTRA_2] = sanitizeField(product.textoExtra2);
  if (product.textoExtra3 != null) fields[FIELD_TEXTO_EXTRA_3] = sanitizeField(product.textoExtra3);
  if (product.textoExtra4 != null) fields[FIELD_TEXTO_EXTRA_4] = sanitizeField(product.textoExtra4);
  // Ingredientes só chegam na etiqueta pelo "Texto extra 4" (idx19) — é o que
  // o template oficial usa e o único caminho confirmado imprimindo. O campo
  // `Ingredientes` do NU3 persiste mas nenhum elemento o renderiza. Não
  // sobrescreve um textoExtra4 que o usuário tenha preenchido à mão.
  if (estaEmBranco(product.textoExtra4) && product.tabelaNutricional?.ingredientes) {
    fields[FIELD_TEXTO_EXTRA_4] = sanitizeField(`Ingredientes: ${product.tabelaNutricional.ingredientes}`);
  }
  if (product.textoExtra5 != null) fields[FIELD_TEXTO_EXTRA_5] = sanitizeField(product.textoExtra5);
  if (product.textoExtra6 != null) fields[FIELD_TEXTO_EXTRA_6] = sanitizeField(product.textoExtra6);
  if (product.textoExtra7 != null) fields[FIELD_TEXTO_EXTRA_7] = sanitizeField(product.textoExtra7);
  if (product.validadeDias != null) {
    fields[FIELD_VALIDADE_DIAS] = String(Math.round(product.validadeDias));
    // Sem este flag a balança guarda os dias mas não imprime a data.
    fields[FIELD_IMPRIMIR_VALIDADE] = "1";
  }
  // Data de venda/embalagem só são impressas se o layout tiver a caixa
  // correspondente — ligar o flag aqui é inofensivo quando não tem, e evita
  // que o elemento saia em branco quando tem.
  fields[FIELD_IMPRIMIR_DATA_VENDA] = "1";
  fields[FIELD_IMPRIMIR_DATA_EMBALAGEM] = "1";
  if (product.taxType != null && product.taxType >= 1 && product.taxType <= 3) {
    fields[FIELD_TAX_TYPE] = String(product.taxType);
    fields[FIELD_TAX] = String(Math.round((product.taxaImposto ?? 0) * 10000));
  }
  if (product.formatoImpressao != null) {
    fields[FIELD_VINCULO_FORMATO_IMPRESSAO] = String(product.formatoImpressao.numero);
  }
  if (product.tabelaNutricional != null) {
    fields[FIELD_VINCULO_TABELA_NUTRICIONAL] = String(product.tabelaNutricional.numero);
    // O registro de Alérgico reusa o número da tabela nutricional (ver buildSyncBody).
    if (product.tabelaNutricional.selos != null && product.tabelaNutricional.selos.length > 0) {
      fields[FIELD_VINCULO_ALERGICO] = String(product.tabelaNutricional.numero);
    }
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
/**
 * Mapa `tipo` do elemento do editor visual → tripla `Flag1/Flag2/Flag3` do
 * wire (`LabelItem`), que é o que diz pra balança QUAL dado cada caixa
 * posicionada deve imprimir. Sem isso a etiqueta sai em branco (era o bug
 * do card #30 — tudo ia hardcoded em 0).
 *
 * FONTE DEFINITIVA (não é mais inferência): `LabelItem.xml` do software
 * oficial — `C:\Program Files (x86)\Ramuza\TM-xA V3.15A\Config\pt-BR\`.
 * É o dicionário que o próprio Ramuza.exe carrega (`Program.MergeConfig`)
 * pra montar os combos do editor de etiqueta, com os nomes em português de
 * cada combinação. Estrutura confirmada em `LabelForm.cs`/`GetDisplay()`:
 *
 *   Flag1=0 Código de barras   (Flag2: 0=legível, 1=não legível)
 *   Flag1=1 Item               → **Flag3** escolhe o campo do produto:
 *                                 0=Nome, 1=Peso/Peças, 2=Tara,
 *                                 3=Primeiro preço unit., 4=Preço unit. a
 *                                 pagar, 5=Preço, 6=Número do PLU,
 *                                 10=Código do produto, 11=Data impressão,
 *                                 15=Data de validade, 23=Peso bruto,
 *                                 25=Preço unit., 30=Número e nome do PLU
 *   Flag1=2 Informação venda   → **Flag2**: 0=Nome da loja, 7=Peso,
 *                                 8=Preço total, 12=Unid. peso,
 *                                 16=Unid. dinheiro, 17-24=Texto extra 1-8
 *   Flag1=3 Textos constantes  → Flag2 = índice do Text1-32 do cabeçalho LAB
 *   Flag1=4 Borda / Flag1=5 Divisória / Flag1=6 Imagem
 *   Flag1=7 Impressão customizada → Flag2: 0=Tabela Nutricional,
 *                                 1=Fornecedor, 2=Alérgicos, 3=Outras
 *                                 (Flag3 sub-seleciona: 3/4="Texto longo")
 *
 * Cruzado com os 36 elementos do template oficial PF-1 lidos do hardware —
 * bate 1:1 (inclusive o "B" de peso bruto = 7/3/1 "Tare or Not(B/L)").
 * `nome` e `codigoBarras` já reconfirmados imprimindo fisicamente.
 * Tipos sem entrada aqui caem em 0/0/0 (comportamento antigo, sem regressão).
 */
const FLAG_POR_TIPO: Record<string, { flag1: number; flag2: number; flag3: number }> = {
  nome: { flag1: 1, flag2: 0, flag3: 0 }, // Item → Nome (confirmado no hardware)
  codigoBarras: { flag1: 0, flag2: 0, flag3: 0 }, // Código de barras → Código legível (confirmado)
  preco: { flag1: 2, flag2: 8, flag3: 0 }, // Informação de venda → Preço total (a caixa "Total R$" da etiqueta oficial)
  precoUnitario: { flag1: 1, flag2: 0, flag3: 4 }, // Item → Preço unit. a pagar ("Preço/kg")
  peso: { flag1: 1, flag2: 0, flag3: 1 }, // Item → Peso/Peças
  pesoBrutoLiquido: { flag1: 7, flag2: 3, flag3: 1 }, // Outras → "Tare or Not (B/L)" — o "B" ao lado do peso
  tara: { flag1: 1, flag2: 0, flag3: 2 }, // Item → Tara
  // Data e validade: o template oficial "Modelo com tabela 60x120" (LabelID 15,
  // lido do banco do software) usa os campos de "Impressão customizada →
  // Outras", NÃO os de "Item" (1/0/13 e 1/0/15). Os de Item existem no
  // dicionário mas não foram os escolhidos por quem desenhou os modelos de
  // fábrica — seguimos o que comprovadamente imprime.
  dataEmbalagem: { flag1: 7, flag2: 3, flag3: 2 }, // Outras → Imprimir date (Date retro)
  validade: { flag1: 7, flag2: 3, flag3: 3 }, // Outras → Data de validade (Date retro)
  tabelaNutricional: { flag1: 7, flag2: 0, flag3: 0 }, // Impressão customizada → Tabela Nutricional
  // Ingredientes: CONFIRMADO no hardware que sai por `1/0/19` ("Texto extra 4"
  // do PLU), igual ao template oficial — o campo `Ingredientes` do bloco NU3
  // existe e persiste, mas nenhum elemento de etiqueta o renderiza; testado
  // `7/3/4` ("Texto longo") e saiu vazio. Por isso `buildPluRow` copia o texto
  // de ingredientes da tabela nutricional pro idx19 do PLU quando o produto
  // não usa esse texto extra pra outra coisa.
  ingredientes: { flag1: 1, flag2: 0, flag3: 19 },
  // Nem todo texto extra do PLU pode ir pra etiqueta: no dicionário oficial os
  // Flag3 16/17/18 são "#NULL#" (não existem como elemento), só há "Texto
  // extra 4" (19), "Texto extra 5" (20), "Lot" (21) e "Texto extra 7" (22).
  // O 19 é o slot que `ingredientes` usa acima.
  textoExtra5: { flag1: 1, flag2: 0, flag3: 20 },
  lote: { flag1: 1, flag2: 0, flag3: 21 },
  textoExtra7: { flag1: 1, flag2: 0, flag3: 22 },
  // Borda e Divisória: documentados no `Config/pt-BR/LabelItem.xml` oficial.
  // Em Borda (Flag1=4) o Flag2 é a própria espessura (1..15) — por isso o
  // valor real vem de `el.espessura` em buildLabelBlock, e o 2 aqui é só o
  // padrão (a espessura mais usada nos modelos de fábrica, junto com 15).
  // Em Divisória (Flag1=5) o Flag2 escolhe o comportamento: 0="Flag da área"
  // (marcador de região, NÃO desenha nada), 1="Imprimir página",
  // 2="Imprimir linha". Só o 2 é uma linha visível, e é o que usamos.
  borda: { flag1: 4, flag2: 2, flag3: 0 },
  divisoria: { flag1: 5, flag2: 2, flag3: 0 },
  selos: { flag1: 7, flag2: 2, flag3: 2 }, // Alérgicos → Informação (é assim que a balança desenha os selos "ALTO EM")
  fornecedor: { flag1: 7, flag2: 1, flag3: 2 }, // Fornecedor → Informação (bloco SU2, idx60 do PLU — ainda sem UI)
};

/**
 * O cabeçalho `LAB` leva largura/altura em MILÍMETROS, mas cada elemento
 * (`LAS`) leva Left/Top/Width/Height em OITAVOS de milímetro. Confirmado no
 * template oficial PF-1 lido do hardware: header diz `58 x 60` e os
 * elementos vão até Left=424 / Top=480 — exatamente 58×8 e 60×8. Sem esta
 * conversão tudo sai 8× menor, amontoado e sobreposto no canto superior
 * esquerdo (foi o que aconteceu no teste de 2026-08-29).
 */
const WIRE_UNITS_PER_MM = 8;

/**
 * Fonte padrão por tipo quando o usuário não escolheu uma no editor (o
 * campo `fonte` é opcional e vinha como 0, que é pequeno demais pra
 * destaque). Valores copiados do template oficial PF-1 lido do hardware:
 * nome e preço total usam 11, textos auxiliares 4-5, tabela nutricional 13.
 */
const FONTE_PADRAO_POR_TIPO: Record<string, number> = {
  nome: 11,
  preco: 11,
  precoUnitario: 5,
  peso: 5,
  tara: 5,
  validade: 5,
  dataEmbalagem: 5,
  pesoBrutoLiquido: 4,
  codigoBarras: 1,
  tabelaNutricional: 8, // font do template oficial LabelID 15 pra caixa da tabela
  ingredientes: 4,
  selos: 1, // os selos são desenhados graficamente; o oficial usa font 1
  fornecedor: 1,
};

/** Quantos slots de texto constante o cabeçalho `LAB` carrega (Text1-32). */
const MAX_TEXTOS_CONSTANTES = 32;

function buildLabelBlock(formato: FormatoImpressaoPayload, bmpSelosId?: number): string {
  const toWire = (mm: number) => String(Math.round(mm * WIRE_UNITS_PER_MM));

  // Elementos de texto livre viram "Textos constantes" (Flag1=3): o texto em
  // si mora num dos 32 slots do cabeçalho LAB e o elemento só aponta pro
  // índice do slot via Flag2. Antes esses 32 slots iam sempre vazios, então
  // toda legenda ("Data:", "Validade:", ...) saía em branco na impressão.
  const textos: string[] = new Array(MAX_TEXTOS_CONSTANTES).fill("");
  const slotPorElemento = new Map<number, number>();
  formato.elementos.forEach((el, i) => {
    if (el.tipo !== "texto" || !el.texto) return;
    const slot = slotPorElemento.size;
    if (slot >= MAX_TEXTOS_CONSTANTES) return; // além de 32 não há onde guardar
    textos[slot] = sanitizeField(el.texto);
    slotPorElemento.set(i, slot);
  });

  const header =
    [
      "LAB",
      String(formato.numero),
      sanitizeField(formato.nome),
      "0", // Sort
      String(Math.round(formato.larguraMm)),
      String(Math.round(formato.alturaMm)),
      ...textos.slice(0, 16), // Text1-16
      "0", // Version
      ...textos.slice(16, 32), // Text17-32
    ].join("\t") + "\t\r\n";

  const elementos = formato.elementos
    .map((el, i) => {
      const slot = slotPorElemento.get(i);
      const flag =
        slot !== undefined
          ? { flag1: 3, flag2: slot, flag3: 0 } // Textos constantes → Text(slot+1)
          : el.tipo === "imagem"
            ? { flag1: 6, flag2: el.imagemNumero ?? 0, flag3: 0 } // Imagem → Flag2 = id do bitmap
            : // Selos viram imagem quando há um bitmap gerado pra este produto;
              // sem bitmap, caem no campo de Alérgico (texto corrido).
              el.tipo === "selos" && bmpSelosId != null
              ? { flag1: 6, flag2: bmpSelosId, flag3: 0 }
              : el.tipo != null
                ? FLAG_POR_TIPO[el.tipo]
                : undefined;
      // Só em Borda o Flag2 É a espessura. Em Divisória ele escolhe o
      // COMPORTAMENTO (0=Flag da área, 1=Imprimir página, 2=Imprimir linha) —
      // deixar a espessura sobrescrevê-lo transformaria a linha em outra
      // coisa, provavelmente num marcador invisível.
      const flag2 = el.tipo === "borda" && el.espessura != null ? el.espessura : (flag?.flag2 ?? 0);

      return [
        "LAS",
        String(i + 1), // SubID
        String(flag?.flag1 ?? 0), // Flag1
        String(flag2), // Flag2
        String(flag?.flag3 ?? 0), // Flag3
        "1", // Print
        String(Math.round(((el.angulo ?? 0) / 90) % 4)), // Angle (índice de giro de 90°)
        String(el.alinhamento ?? 0), // Align
        String(el.fonte ?? (el.tipo != null ? (FONTE_PADRAO_POR_TIPO[el.tipo] ?? 4) : 4)), // Font
        toWire(el.x), // Left (1/8 mm)
        toWire(el.y), // Top (1/8 mm)
        toWire(el.largura), // Width (1/8 mm)
        toWire(el.altura), // Height (1/8 mm)
      ].join("\t") + "\t\r\n";
    })
    .join("");

  return header + elementos + "LAE\t\r\n";
}

/**
 * Monta o bloco `DWL/CLS` (cadastro de Setor como "Class" na balança) —
 * achado em `RDS.cs`/`NetForm.cs` (`checkPara.bclass`), enviado ANTES do
 * bloco PLU na sequência real do software oficial (`ClassID` é referenciado
 * pelo PLU, então precisa existir primeiro). Formato por linha: ClassID,
 * Name, DeptID, LabelID1, BarT1, BarF1, LabelID2, BarT2, BarF2 — só
 * ClassID/Name vêm do PesoHub, o resto fica neutro (0, mesmo padrão do
 * `buildLabelBlock`) até termos demanda de usar Department/etiqueta por
 * setor. NÃO CONFIRMADO EM HARDWARE FÍSICO ainda a faixa válida de
 * `ClassID` (mesma classe de limite do `minUserLabelID`/`minUserPLUID`
 * já vistos — testar antes de confiar cegamente).
 */
function buildClassRow(classe: ClassePayload): string {
  return (
    ["CLS", String(classe.numero), sanitizeField(classe.nome), "0", "0", "0", "0", "0", "0"].join("\t") + "\t\r\n"
  );
}

/**
 * Monta uma linha do bloco `DWL/IR2` ("Alérgicos" no `Custom.xml` oficial):
 * `Número`, `Nome` (até 40 chars) e `Informação` (até 80). É o registro de
 * advertência nativo da balança, referenciado pelo idx61 do PLU — usamos ele
 * pros selos "ALTO EM ..." do PesoHub, que não têm cadastro próprio no
 * equipamento. O bloco irmão `SU2` ("Fornecedor", idx60) tem o mesmo formato
 * e ainda não é usado.
 */
const IR2_MAX_NOME = 40;
const IR2_MAX_INFO = 80;

function buildAlergicoRow(numero: number, selos: string[]): string {
  const texto = selos.join(", ");
  return (
    [
      "IR2",
      String(numero),
      sanitizeField(texto).slice(0, IR2_MAX_NOME),
      sanitizeField(texto).slice(0, IR2_MAX_INFO),
    ].join("\t") + "\t\r\n"
  );
}

/**
 * Monta o corpo DWL/PLU(+NU3)/UPL-TIM pra um lote de produtos — extraído de
 * `sendProductsToScale` pra ser reaproveitado tanto pela conexão efêmera
 * (probes, compat) quanto pela conexão persistente (`ScaleConnection`, ver
 * scale-connection.ts) usada em produção pelo agent-local.
 */
export function buildSyncBody(
  products: ScaleSyncPayload[],
  /**
   * Formatos a enviar mesmo sem produto que os use. Sem isso o bloco LAB só
   * existe como efeito colateral dos produtos do pacote, e um formato recém
   * editado que nenhum produto referencia nunca teria como chegar à balança.
   */
  formatosAvulsos: FormatoImpressaoPayload[] = [],
): string {
  const pluNumbers = products.map((p, i) => resolvePluNumber(p.codigo, i));

  // Mesmo dedupe do NU3/LAB: vários produtos podem compartilhar o mesmo Setor.
  const classes = new Map<number, ClassePayload>();
  for (const p of products) {
    if (p.setor != null && p.setor.numero >= CLASS_ID_MIN_SAFE) classes.set(p.setor.numero, p.setor);
  }

  const clsBlock =
    classes.size > 0 ? `DWL\tCLS\t\r\n` + [...classes.values()].map(buildClassRow).join("") + `END\tCLS\t\r\n` : "";

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

  // Selos ("ALTO EM ...") viram registros de Alérgico (`IR2`), reaproveitando
  // o número da própria tabela nutricional — é de lá que os selos vêm no
  // PesoHub, então o vínculo fica 1:1 e sem namespace novo pra gerenciar.
  const alergicos = new Map<number, string[]>();
  for (const t of tabelasNutricionais.values()) {
    if (t.selos != null && t.selos.length > 0) alergicos.set(t.numero, t.selos);
  }

  const ir2Block =
    alergicos.size > 0
      ? `DWL\tIR2\t\r\n` +
        [...alergicos.entries()].map(([numero, selos]) => buildAlergicoRow(numero, selos)).join("") +
        `END\tIR2\t\r\n`
      : "";

  // Mesmo dedupe do NU3: vários produtos podem compartilhar o mesmo formato
  // de etiqueta.
  // Ids de bitmap pros selos: o elemento de imagem só referencia Flag2 1..15,
  // então distribuímos os slots entre as tabelas que têm selos.
  const idsDeSelo = atribuirIdsDeSelo(
    products.filter((p) => (p.tabelaNutricional?.selos?.length ?? 0) > 0).map((p) => p.tabelaNutricional!.numero),
  );

  // Guarda junto qual bitmap de selo cada formato deve referenciar — vem do
  // produto que usa aquele formato (ver bloco BMP abaixo).
  const formatosImpressao = new Map<number, { formato: FormatoImpressaoPayload; bmpSelosId?: number }>();
  for (const p of products) {
    if (p.formatoImpressao == null) continue;
    const entrada = formatosImpressao.get(p.formatoImpressao.numero);
    const bmpSelosId =
      p.tabelaNutricional != null ? idsDeSelo.get(p.tabelaNutricional.numero) : undefined;
    if (entrada == null) {
      formatosImpressao.set(p.formatoImpressao.numero, { formato: p.formatoImpressao, bmpSelosId });
    } else if (entrada.bmpSelosId == null && bmpSelosId != null) {
      entrada.bmpSelosId = bmpSelosId;
    }
  }
  // Os avulsos não sobrescrevem um formato que já veio por produto: aquele
  // carrega o vínculo com o bitmap de selos.
  for (const formato of formatosAvulsos) {
    if (!formatosImpressao.has(formato.numero)) formatosImpressao.set(formato.numero, { formato });
  }

  const labBlock =
    formatosImpressao.size > 0
      ? `DWL\tLAB\t\r\n` +
        [...formatosImpressao.values()].map(({ formato, bmpSelosId }) => buildLabelBlock(formato, bmpSelosId)).join("") +
        `END\tLAB\t\r\n`
      : "";

  // A faixa gráfica "ALTO EM ..." é uma imagem: a balança não sabe desenhar
  // selos, só referenciar um bitmap por id (`Flag1=6`). Geramos um bitmap por
  // tabela nutricional que tenha selos, no tamanho do elemento `selos` do
  // layout que a usa (se houver), e mandamos no bloco `DWL/BMP`.
  const bitmaps = new Map<number, BitmapMonocromatico>();
  for (const p of products) {
    const selos = p.tabelaNutricional?.selos;
    if (!selos || selos.length === 0) continue;
    const id = idsDeSelo.get(p.tabelaNutricional!.numero);
    if (id == null || bitmaps.has(id)) continue;
    const caixa = p.formatoImpressao?.elementos.find((el) => el.tipo === "selos");
    bitmaps.set(id, desenharFaixaSelos(selos, caixa?.largura ?? 56, caixa?.altura ?? 8));
  }

  const bmpBlock = buildBmpBlock(bitmaps);

  return (
    bmpBlock +
    clsBlock +
    `DWL\tPLU\t\r\n` +
    products.map((p, i) => buildPluRow(p, pluNumbers[i])).join("") +
    `END\tPLU\t\r\n` +
    nu3Block +
    ir2Block +
    labBlock +
    `UPL\tTIM\t\r\n`
  );
}

/** Um formato que foi enviado mas não está gravado na balança. */
export interface FormatoDivergente {
  numero: number;
  esperado: string;
  /** `null` = o slot voltou vazio; string = o slot tem OUTRO layout (tipicamente
   * um modelo de fábrica, que é o caso em que a balança descarta a escrita). */
  encontrado: string | null;
}

/**
 * Lê de volta os formatos recém-enviados e confere se colaram.
 *
 * Existe porque ACK não é prova: a balança responde normalmente e descarta a
 * gravação de um `LAB` cujo número caia num slot ocupado por modelo de fábrica
 * (ver card #54 — o slot 1 é "PF-1" e engole qualquer escrita). O produto passa
 * a imprimir com o layout da Ramuza, e nada no protocolo denuncia.
 *
 * Retorna erro APENAS quando a leitura em si falhou. Isso é deliberado: uma
 * leitura que falha devolve resposta vazia, e tratar vazio como "não há nada
 * gravado" produz alarme falso de balança zerada — aconteceu em 2026-09-01.
 * Falha de leitura e slot vazio são coisas diferentes.
 */
export async function verificarFormatosGravados(
  ip: string,
  port: number,
  formatos: FormatoImpressaoPayload[],
): Promise<{ ok: true; divergentes: FormatoDivergente[] } | { ok: false; erro: string }> {
  const divergentes: FormatoDivergente[] = [];

  for (const formato of formatos) {
    const resposta = await lerSlotLab(ip, port, formato.numero);
    if (!resposta.ok) return { ok: false, erro: resposta.erro };

    const esperado = sanitizeField(formato.nome);
    if (resposta.nome !== esperado) {
      divergentes.push({ numero: formato.numero, esperado, encontrado: resposta.nome });
    }
  }

  return { ok: true, divergentes };
}

/** Um slot de etiqueta ocupado na balança. */
export interface SlotEtiqueta {
  numero: number;
  nome: string;
}

/**
 * Conserta nome que na verdade é UTF-8 lido como latin1 ("PadrÃ£o" -> "Padrão").
 *
 * Falamos latin1 com a balança, mas os modelos de fábrica foram gravados pelo
 * software oficial em UTF-8. Só afeta EXIBIÇÃO: a comparação de
 * `verificarFormatosGravados` continua em latin1 puro, que é o que garante o
 * round-trip do que nós mesmos escrevemos.
 */
function repararAcentuacao(nome: string): string {
  // Sem bytes altos não há o que consertar — evita mexer em nome já correto.
  if (!/[\u0080-\u00ff]/.test(nome)) return nome;
  try {
    const decodificado = Buffer.from(nome, "latin1").toString("utf8");
    // Byte inválido em UTF-8 vira U+FFFD: sinal de que não era UTF-8.
    return decodificado.includes("\ufffd") ? nome : decodificado;
  } catch {
    return nome;
  }
}

/**
 * Slots `LAB` **observados como ocupados** nesta leitura.
 *
 * Note a semântica: é o que foi visto, não a lista completa. O `UPL/LAB` sem
 * número é comprovadamente incompleto (card #59) — quatro leituras seguidas
 * contra a mesma balança devolveram 65, 64, 54 e 52 registros, com slots
 * realmente gravados faltando. Pior: duas delas terminaram com `END\tLAB`, o
 * marcador de fim do protocolo. **A balança sinaliza "acabei" numa resposta
 * incompleta**, então não há como distinguir completa de truncada aqui.
 *
 * Por isso quem consome isto NUNCA pode concluir "livre" a partir da ausência
 * de um número. O uso correto é aditivo: unir com o que já se sabia. Errar para
 * "ocupado" é a direção segura — o pior caso é sugerir outro número livre; o
 * inverso manda a pessoa para um slot de fábrica, que descarta em silêncio.
 *
 * Para saber com certeza sobre UM slot, use a leitura filtrada
 * (`UPL/LAB/<n>`, via `verificarFormatosGravados`), que é confiável.
 *
 * Falha de leitura devolve erro, nunca lista vazia — vazio não é dado.
 */
export function listarSlotsEtiqueta(
  ip: string,
  port: number,
): Promise<{ ok: true; slots: SlotEtiqueta[] } | { ok: false; erro: string }> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(15_000);
    socket.setEncoding("latin1");
    let buffer = "";
    let done = false;

    const finish = (r: { ok: true; slots: SlotEtiqueta[] } | { ok: false; erro: string }) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(r);
    };

    socket.connect(port, ip, () => socket.write("UPL\tLAB\t\r\n", "latin1"));

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      if (!buffer.includes("END\tLAB")) return;
      const slots = buffer
        .split("\r\n")
        .filter((l) => l.startsWith("LAB\t"))
        .map((l) => l.split("\t"))
        .filter((f) => f[1] != null && f[1] !== "")
        .map((f) => ({ numero: Number(f[1]), nome: repararAcentuacao(f[2] ?? "") }))
        .filter((s) => Number.isFinite(s.numero));
      finish({ ok: true, slots });
    });

    socket.on("timeout", () =>
      finish({ ok: false, erro: `Timeout ao listar os slots de etiqueta de ${ip}:${port}.` }),
    );
    socket.on("error", (err) =>
      finish({
        ok: false,
        erro: err.message.includes("ECONNRESET")
          ? `A balança ${ip}:${port} recusou a conexão (ECONNRESET) — provavelmente o software da Ramuza está aberto e segurando a sessão.`
          : `Falha ao listar os slots de etiqueta: ${err.message}`,
      }),
    );
    socket.on("close", () =>
      finish({ ok: false, erro: "Conexão encerrada antes de listar os slots de etiqueta." }),
    );
  });
}

/** Lê um slot `LAB` e devolve o nome gravado (`null` se o slot estiver vazio). */
function lerSlotLab(
  ip: string,
  port: number,
  numero: number,
): Promise<{ ok: true; nome: string | null } | { ok: false; erro: string }> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(10_000);
    socket.setEncoding("latin1");
    let buffer = "";
    let done = false;

    const finish = (r: { ok: true; nome: string | null } | { ok: false; erro: string }) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(r);
    };

    socket.connect(port, ip, () => socket.write(`UPL\tLAB\t${numero}\t\r\n`, "latin1"));

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      if (!buffer.includes("END\tLAB")) return;
      const linha = buffer.split("\r\n").find((l) => l.startsWith(`LAB\t${numero}\t`));
      finish({ ok: true, nome: linha != null ? (linha.split("\t")[2] ?? null) : null });
    });

    socket.on("timeout", () =>
      finish({ ok: false, erro: `Timeout ao reler o formato ${numero} da balança ${ip}:${port}.` }),
    );
    socket.on("error", (err) =>
      finish({
        ok: false,
        erro:
          err.message.includes("ECONNRESET")
            ? // A balança atende um cliente por vez; quem costuma estar segurando
              // a sessão é o software oficial aberto na máquina da loja.
              `A balança ${ip}:${port} recusou a conexão (ECONNRESET). Feche o software da Ramuza, que mantém a sessão ocupada, e sincronize de novo.`
            : `Falha ao reler o formato ${numero} da balança: ${err.message}`,
      }),
    );
    socket.on("close", () =>
      finish({ ok: false, erro: `Conexão encerrada antes de reler o formato ${numero}.` }),
    );
  });
}

/** Mensagem de erro para formatos que não colaram, com o motivo provável. */
export function descreverFormatosDivergentes(divergentes: FormatoDivergente[]): string {
  const detalhes = divergentes
    .map((d) =>
      d.encontrado == null
        ? `formato ${d.numero} ("${d.esperado}") não foi gravado — o slot está vazio`
        : `formato ${d.numero} ("${d.esperado}") não foi gravado — o slot ainda contém "${d.encontrado}"`,
    )
    .join("; ");
  return (
    `${detalhes}. A balança aceitou o envio e descartou em silêncio, o que acontece quando o ` +
    `número do formato cai num slot ocupado por um modelo de fábrica. Escolha outro número ` +
    `para o formato de impressão e sincronize de novo.`
  );
}

/**
 * Cliente TCP real para a balança Ramuza/Atena (protocolo TXT-MODE, porta 33581).
 * Handshake replicado do que o software oficial faz ao clicar "Download" na tela
 * Ethernet: envia o bloco DWL/PLU/END com os produtos, pede sincronismo de hora
 * (UPL TIM) e fecha a sessão com UPL END. Ver [[ramuza-scale-protocol]].
 *
 * Esta é a função que roda em produção — `index.ts` chama daqui.
 *
 * Ela abre e fecha uma conexão nova a cada chamada, e isso está certo. Em
 * 2026-08-27 uma captura Wireshark sugeriu que o `DWL/NU3` só persistia numa
 * conexão longa, e `ScaleConnection` (scale-connection.ts) nasceu dessa
 * hipótese. **A hipótese estava errada**: o NU3 não persistia porque a linha
 * saía com 57 campos e a balança exige 58 (tentativa 28, ver
 * [[project_scale_protocol_field_gap]]). Com o campo corrigido, a conexão
 * efêmera funciona — foi verificada contra o hardware.
 *
 * `ScaleConnection` continua no repositório como registro da hipótese
 * descartada, mas **não é usada por ninguém e não deve ser adotada** sem uma
 * nova medição que a justifique.
 */
export async function sendProductsToScale(
  ip: string,
  port: number,
  products: ScaleSyncPayload[],
  formatosAvulsos: FormatoImpressaoPayload[] = [],
): Promise<ScaleSyncOutcome> {
  const outcome = await escreverNaBalanca(ip, port, products, formatosAvulsos);
  if (!outcome.ok) return outcome;

  // Escrita aceita não é escrita gravada (card #54). Confere os formatos que
  // saíram neste lote relendo cada slot; sem isso, um layout descartado vira
  // "sincronizado com sucesso" e o problema só aparece no papel, na loja.
  const formatosEnviados = [
    ...new Map(
      [...products.map((p) => p.formatoImpressao), ...formatosAvulsos]
        .filter((f): f is FormatoImpressaoPayload => f != null)
        .map((f) => [f.numero, f]),
    ).values(),
  ];
  if (formatosEnviados.length === 0) return outcome;

  const conferencia = await verificarFormatosGravados(ip, port, formatosEnviados);
  if (!conferencia.ok) {
    // Não dá pra afirmar que gravou nem que falhou — dizer isso é melhor do que
    // escolher um dos dois e mentir.
    return { ok: false, erro: `Envio aceito, mas não foi possível confirmar: ${conferencia.erro}` };
  }
  if (conferencia.divergentes.length > 0) {
    return { ok: false, erro: descreverFormatosDivergentes(conferencia.divergentes) };
  }

  return outcome;
}

function escreverNaBalanca(
  ip: string,
  port: number,
  products: ScaleSyncPayload[],
  formatosAvulsos: FormatoImpressaoPayload[],
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
      socket.write(buildSyncBody(products, formatosAvulsos), "latin1");
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
