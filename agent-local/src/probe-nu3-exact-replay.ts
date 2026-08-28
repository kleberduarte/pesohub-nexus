import { Socket } from "net";

/**
 * Replay byte-a-byte da sequência REAL capturada do software oficial
 * (captura05.json, conexão porta 50121, 2026-08-27) — não uma reconstrução
 * aproximada, os bytes exatos extraídos do hex do payload TCP de cada pacote
 * client->scale, na ordem e com os deltas de tempo reais entre eles. A única
 * mudança é o conteúdo da tabela NU3 índice 1 (nome + 2 dos valores), pra
 * termos como confirmar se persistiu sem ambiguidade (o valor original
 * "TESTE ZERO" já existia no device antes desta captura).
 *
 * Sequência exata (ver [[project_scale_protocol_field_gap]]):
 *   1. BOM cru (EF BB BF) sozinho, ANTES de qualquer comando
 *   2. \r\nUPL/INF\r\n
 *   3. (recebe DWL/INF espontâneo) -> UPL/END
 *   4. DWL/TIM (sync hora) + DWL/TMS TMS58=1 + UPL/TMS 55 (pede dump completo)
 *   5. (recebe dump TMS gigante) -> UPL/END
 *   6. ~17.6s depois: heartbeat \r\n, então UPL/TIM -> UPL/END
 *   7. ~8.8s depois: heartbeat \r\n, então DWL/NU3 (aqui alterado) + UPL/TIM
 *   8. UPL/END final
 *
 * Uso: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-exact-replay.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);

function hex(s: string): Buffer {
  return Buffer.from(s.replace(/[^0-9a-f]/gi, ""), "hex");
}

const PKT_BOM = hex("ef bb bf");
const PKT_UPL_INF = hex("0d 0a 55 50 4c 09 49 4e 46 09 0d 0a");
const PKT_UPL_END_1 = hex("55 50 4c 09 45 4e 44 09 0d 0a");
const PKT_TIM_TMS_BLOCK = hex(
  "0d 0a 44 57 4c 09 54 49 4d 09 0d 0a 54 49 4d 09 32 36 09 38 09 32 37 09 31 37 09 34 09 36 09 0d 0a " +
    "45 4e 44 09 54 49 4d 09 0d 0a 44 57 4c 09 54 4d 53 09 0d 0a 54 4d 53 09 35 38 09 31 09 0d 0a " +
    "45 4e 44 09 54 4d 53 09 0d 0a 0d 0a 55 50 4c 09 54 4d 53 09 35 35 09 0d 0a",
);
const PKT_UPL_END_2 = hex("55 50 4c 09 45 4e 44 09 0d 0a");
const PKT_HEARTBEAT_1 = hex("0d 0a");
const PKT_UPL_TIM = hex("0d 0a 55 50 4c 09 54 49 4d 09 0d 0a");
const PKT_UPL_END_3 = hex("55 50 4c 09 45 4e 44 09 0d 0a");
const PKT_HEARTBEAT_2 = hex("0d 0a");

// Corpo do DWL/NU3 REAL capturado (frame #1361, hex bruto abaixo), decodificado
// byte a byte — não redigitado à mão, pra não repetir o erro de contagem de
// campos (51 vs 54) da primeira tentativa desta sessão.
const PKT_NU3_WRITE_ORIGINAL_HEX =
  "44 57 4c 09 4e 55 33 09 0d 0a 4e 55 33 09 30 09 09 09 30 09 09 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 0d 0a 4e 55 33 09 31 09 54 45 53 54 45 20 5a 45 52 4f 09 09 34 30 09 67 09 09 31 30 2c 30 09 30 2c 30 09 35 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 09 30 2c 30 09 30 2c 30 09 0d 0a 45 4e 44 09 4e 55 33 09 0d 0a 0d 0a 55 50 4c 09 54 49 4d 09 0d 0a";
const PKT_NU3_WRITE_ORIGINAL_TEXT = hex(PKT_NU3_WRITE_ORIGINAL_HEX).toString("latin1");
// Substituição de texto na string decodificada byte-a-byte (não recriada à
// mão) — preserva a contagem exata de 54 campos por linha do registro real.
const PKT_NU3_WRITE_TEXT = PKT_NU3_WRITE_ORIGINAL_TEXT.replace("TESTE ZERO", "REPLAYFULL").replace(
  "10,0\t0,0\t5,0",
  "931,0\t0,0\t932,0",
);
const PKT_NU3_WRITE = Buffer.from(PKT_NU3_WRITE_TEXT, "latin1");
const PKT_UPL_END_4 = hex("55 50 4c 09 45 4e 44 09 0d 0a");

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
  console.log(`Conectado a ${ip}:${port}. Iniciando replay exato...\n`);

  console.log("[t=0.000] BOM cru");
  socket.write(PKT_BOM);
  await wait(255);

  console.log("[t=0.255] UPL/INF");
  socket.write(PKT_UPL_INF);
  await wait(179);

  console.log("[t=0.434] UPL/END (ack anúncio DWL/INF)");
  socket.write(PKT_UPL_END_1);
  await wait(68);

  console.log("[t=0.502] DWL/TIM + DWL/TMS 58=1 + UPL/TMS 55");
  socket.write(PKT_TIM_TMS_BLOCK);
  await wait(6353);

  console.log("[t=6.855] UPL/END (ack dump TMS)");
  socket.write(PKT_UPL_END_2);
  await wait(17576);

  console.log("[t=24.431] heartbeat \\r\\n");
  socket.write(PKT_HEARTBEAT_1);
  await wait(356);

  console.log("[t=24.787] UPL/TIM");
  socket.write(PKT_UPL_TIM);
  await wait(402);

  console.log("[t=25.189] UPL/END");
  socket.write(PKT_UPL_END_3);
  await wait(8787);

  console.log("[t=33.976] heartbeat \\r\\n");
  socket.write(PKT_HEARTBEAT_2);
  await wait(279);

  console.log("[t=34.255] DWL/NU3 (índice 1 = REPLAYFULL/931-934) + UPL/TIM");
  raw = Buffer.alloc(0);
  socket.write(PKT_NU3_WRITE);
  await wait(2000);
  console.log("Resposta ao write NU3:", JSON.stringify(raw.toString("latin1")));

  console.log("[t=~36] UPL/END final");
  socket.write(PKT_UPL_END_4);
  await wait(500);
  socket.destroy();

  console.log("\nFeito. Rode: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-dump.ts e confira o índice 1 (esperado: 'REPLAYFULL', 931/932/933/934).");
  process.exit(0);
})();
