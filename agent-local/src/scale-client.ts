import { Socket } from "net";

export interface ScaleSyncPayload {
  codigo: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  categoriaImposto?: string;
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
 * por produto: 1 (número PLU), 2 (código), 3 (EAN13/endereço), 5 (preço), 15 (nome).
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
const FIELD_PRICE = 5;
const FIELD_NAME = 15;

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

function buildPluRow(product: ScaleSyncPayload, pluNumber: number): string {
  const fields = [...PLU_FIELD_TEMPLATE];
  fields[FIELD_PLU_NUMBER] = String(pluNumber);
  fields[FIELD_PRODUCT_CODE] = product.codigo;
  fields[FIELD_EAN13] = product.codigoBarras ?? "";
  fields[FIELD_PRICE] = encodePrice(product.preco);
  fields[FIELD_NAME] = product.nome;
  return fields.join("\t") + "\r\n";
}

/**
 * Cliente TCP real para a balança Ramuza/Atena (protocolo TXT-MODE, porta 33581).
 * Handshake replicado do que o software oficial faz ao clicar "Download" na tela
 * Ethernet: envia o bloco DWL/PLU/END com os produtos, pede sincronismo de hora
 * (UPL TIM) e fecha a sessão com UPL END. Ver [[ramuza-scale-protocol]].
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
      const pluNumbers = products.map((p, i) => resolvePluNumber(p.codigo, i));
      const body =
        `DWL\tPLU\t\r\n` +
        products.map((p, i) => buildPluRow(p, pluNumbers[i])).join("") +
        `END\tPLU\t\r\n` +
        `UPL\tTIM\t\r\n`;
      socket.write(body, "latin1");
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
