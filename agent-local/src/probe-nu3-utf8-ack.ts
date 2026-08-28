import { Socket } from "net";

/**
 * Testa a diferença de protocolo achada em NetForm.cs (linha ~2398-2489,
 * ver [[project_scale_protocol_field_gap]]): ao conectar, a balança manda um
 * bloco DWL/INF espontâneo (INA/INM/INF...END/INF). O software oficial:
 *   1. lê INA (UTF-8/UTF-8) e troca a codificação da conexão pra UTF-8
 *      (recriando o StreamWriter, que emite BOM EF BB BF no 1º write + uma
 *      linha em branco);
 *   2. só DEPOIS disso responde "UPL\tEND\t" pra fechar esse handshake
 *      inicial;
 *   3. só ENTÃO manda DWL/PLU ou DWL/NU3.
 * Nenhum probe anterior respondeu a esse anúncio inicial nem trocou pra
 * UTF-8 — todos mandaram DWL/NU3 direto em latin1/ASCII cru. Testando aqui.
 *
 * Uso: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-utf8-ack.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);

const TABLE_INDEX = 3;
const TABLE_NAME = "UTF8ACK";
const NU3_ROW =
  `NU3\t${TABLE_INDEX}\t${TABLE_NAME}\t\t50\tg\t\t` +
  `911,0\t0,0\t912,0\t0,0\t913,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t914,0\t0,0\t0,0\t0,0\t0,0\t0,0\t` +
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
  console.log(`Conectado a ${ip}:${port}. Esperando anúncio espontâneo DWL/INF...`);

  const deadline = Date.now() + 5000;
  while (!raw.toString("latin1").includes("END\tINF") && Date.now() < deadline) {
    await wait(100);
  }
  const announce = raw.toString("latin1");
  console.log("\nAnúncio recebido:", JSON.stringify(announce));
  if (!announce.includes("UTF-8")) {
    console.log("AVISO: não achei 'UTF-8' no anúncio — a troca de encoding pode não se aplicar aqui.");
  }

  console.log("\nTrocando pra UTF-8: mandando BOM + linha em branco (recriação do StreamWriter, como Client_RW faz)...");
  socket.write(Buffer.concat([UTF8_BOM, Buffer.from("\r\n", "utf8")]));
  await wait(300);

  console.log("Respondendo UPL/END pra fechar o handshake inicial (linha 2489 do NetForm.cs)...");
  socket.write(Buffer.from("UPL\tEND\t\r\n", "utf8"));
  await wait(500);

  console.log("\nEnviando DWL/NU3 em UTF-8, na mesma conexão pós-handshake...");
  raw = Buffer.alloc(0);
  const body = `DWL\tNU3\t\r\n${NU3_ROW}END\tNU3\t\r\n` + `UPL\tTIM\t\r\n`;
  socket.write(Buffer.from(body, "utf8"));
  await wait(2000);
  console.log("Resposta ao write:", JSON.stringify(raw.toString("latin1")));

  socket.write(Buffer.from("UPL\tEND\t\r\n", "utf8"));
  await wait(500);
  socket.destroy();

  console.log("\nFeito. Rode: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-dump.ts e confira o índice 3 (esperado: 'UTF8ACK', 911/912/913/914).");
  process.exit(0);
})();
