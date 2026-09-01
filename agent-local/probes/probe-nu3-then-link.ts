import { Socket } from "net";
import { buildNu3Row, buildPluRow, ScaleSyncPayload } from "../src/scale-client";

/**
 * Testa a ordem real observada em captura06.json (ver
 * [[project_scale_protocol_field_gap]]): o software oficial escreveu o
 * conteúdo do NU3 (índice 1, SEM vínculo de nenhum PLU ainda) e só ~15
 * segundos depois, numa escrita DWL/PLU separada, setou idx59=1 pro produto
 * 9026. Nunca testamos essa ordem — sempre mandamos PLU (já com vínculo) e
 * NU3 juntos na mesma escrita, PLU primeiro.
 *
 * Uso: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-then-link.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);

const TABLE_INDEX = 5; // índice novo, nunca usado em nenhum teste anterior
const TEST_PLU = 602;

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  const socket = new Socket();
  let raw = Buffer.alloc(0);
  socket.on("data", (chunk: Buffer) => {
    raw = Buffer.concat([raw, chunk]);
  });
  socket.on("error", (err) => console.log("!!! erro:", err.message));

  await new Promise<void>((resolve, reject) => {
    socket.connect(port, ip, () => resolve());
    socket.once("error", reject);
  });
  console.log(`Conectado a ${ip}:${port}.`);

  const nu3Row = buildNu3Row({
    numero: TABLE_INDEX,
    nome: "ORDEM INVERTIDA",
    porcao: "50g",
    itens: [{ ordem: 1, valor: 555 }],
  });

  console.log(`Passo 1: escrevendo DWL/NU3 (índice ${TABLE_INDEX}, sem vínculo de PLU ainda)...`);
  raw = Buffer.alloc(0);
  socket.write(Buffer.from(`DWL\tNU3\t\r\n${nu3Row}END\tNU3\t\r\n\r\nUPL\tTIM\t\r\n`, "latin1"));
  await wait(1500);
  console.log("Resposta:", JSON.stringify(raw.toString("latin1")));
  socket.write(Buffer.from("UPL\tEND\t\r\n", "latin1"));
  await wait(500);

  console.log("Esperando 15s antes do PLU (imitando o intervalo real da captura)...");
  await wait(15_000);

  const product: ScaleSyncPayload = {
    codigo: String(TEST_PLU),
    codigoBarras: "",
    nome: "PROBE ORDEM",
    preco: 9.99,
    tabelaNutricional: { numero: TABLE_INDEX, nome: "ORDEM INVERTIDA", itens: [] },
  };
  const pluRow = buildPluRow(product, TEST_PLU);

  console.log(`Passo 2: escrevendo DWL/PLU ${TEST_PLU} com vínculo idx59=${TABLE_INDEX} (escrita separada)...`);
  raw = Buffer.alloc(0);
  socket.write(Buffer.from(`DWL\tPLU\t\r\n${pluRow}END\tPLU\t\r\n\r\nUPL\tTIM\t\r\n`, "latin1"));
  await wait(1500);
  console.log("Resposta:", JSON.stringify(raw.toString("latin1")));
  socket.write(Buffer.from("UPL\tEND\t\r\n", "latin1"));
  await wait(500);

  socket.destroy();
  console.log(`\nFeito. Rode probe-nu3-dump.ts e confira o índice ${TABLE_INDEX} (esperado: 'ORDEM INVERTIDA', 555,0).`);
  process.exit(0);
})();
