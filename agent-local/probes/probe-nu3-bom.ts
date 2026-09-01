import { Socket } from "net";

/**
 * Testa o achado da captura Wireshark real (captura05.json, 2026-08-27):
 * TODA conexão do software oficial começa com um pacote cru de 3 bytes
 * "EF BB BF" (BOM UTF-8) mandado SOZINHO, ANTES de qualquer comando —
 * confirmado via hex exato do payload TCP do primeiro pacote de dados de
 * CADA conexão nova (frames #746 e #836 da captura, hex "ef:bb:bf"), seguido
 * só depois por "\r\nUPL\tINF\t\r\n". Nenhuma das 19 tentativas anteriores
 * mandou esse BOM. Ver [[project_scale_protocol_field_gap]].
 *
 * Uso: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-bom.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);

const TABLE_INDEX = 3;
const TABLE_NAME = "BOMTEST";
const NU3_ROW =
  `NU3\t${TABLE_INDEX}\t${TABLE_NAME}\t\t50\tg\t\t` +
  `921,0\t0,0\t922,0\t0,0\t923,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t924,0\t0,0\t0,0\t0,0\t0,0\t0,0\t` +
  `\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\r\n`;

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  const socket = new Socket();
  let raw = Buffer.alloc(0);

  socket.on("data", (chunk: Buffer) => {
    raw = Buffer.concat([raw, chunk]);
    console.log(">>> recv:", JSON.stringify(chunk.toString("latin1")));
  });
  socket.on("error", (err) => console.log("!!! erro:", err.message));

  await new Promise<void>((resolve, reject) => {
    socket.connect(port, ip, () => resolve());
    socket.once("error", reject);
  });
  console.log(`Conectado a ${ip}:${port}.`);

  // Passo 1 (novo): BOM cru, sozinho, ANTES de qualquer comando — exatamente
  // como o frame #746/#836 da captura real.
  console.log("Enviando BOM UTF-8 cru (EF BB BF) como primeiro pacote...");
  socket.write(UTF8_BOM);
  await wait(300);

  // Passo 2: UPL/INF, igual sempre fizemos.
  raw = Buffer.alloc(0);
  console.log("Enviando \\r\\nUPL\\tINF\\t\\r\\n...");
  socket.write(Buffer.from("\r\nUPL\tINF\t\r\n", "latin1"));
  await wait(1000);
  console.log("Resposta ao INF:", JSON.stringify(raw.toString("latin1")));

  // Passo 3: responde UPL/END ao anúncio (se veio).
  if (raw.toString("latin1").includes("END\tINF")) {
    console.log("Anúncio DWL/INF recebido — respondendo UPL/END...");
    socket.write(Buffer.from("UPL\tEND\t\r\n", "latin1"));
    await wait(500);
  } else {
    console.log("AVISO: anúncio DWL/INF não veio dessa vez — seguindo mesmo assim.");
  }

  console.log("\nEnviando DWL/NU3 na mesma conexão pós-BOM...");
  raw = Buffer.alloc(0);
  const body = `DWL\tNU3\t\r\n${NU3_ROW}END\tNU3\t\r\n` + `UPL\tTIM\t\r\n`;
  socket.write(Buffer.from(body, "latin1"));
  await wait(2000);
  console.log("Resposta ao write:", JSON.stringify(raw.toString("latin1")));

  socket.write(Buffer.from("UPL\tEND\t\r\n", "latin1"));
  await wait(500);
  socket.destroy();

  console.log("\nFeito. Rode: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-dump.ts e confira o índice 3 (esperado: 'BOMTEST', 921/922/923/924).");
  process.exit(0);
})();
