import { Socket } from "net";

/**
 * Testa a hipótese "conexão precisa estar registrada/idle há um tempo real"
 * (ver [[project_scale_protocol_field_gap]], seção 2026-08-27 continuação 4):
 * no Ramuza.exe decompilado, `myTag.Client` (o TcpClient que escreve NU3) já
 * vem pronto de dentro de UploadECS/SaveCustom — criado bem antes, quando o
 * dispositivo é "vinculado" no painel (`AddLink()`), não uma conexão nova de
 * curta duração como todos os probes anteriores abriram.
 *
 * Aqui: UMA conexão TCP só, handshake UPL/INF de registro (como o painel faz
 * ao reconhecer o device), depois fica viva de verdade por IDLE_SECONDS
 * (default 180s) com round-trips periódicos de UPL/TIM a cada 30s — só
 * DEPOIS disso manda o DWL/NU3, na MESMA conexão.
 *
 * Uso: SCALE_IP=192.168.15.5 IDLE_SECONDS=180 npx ts-node --transpile-only src/probe-nu3-long-lived.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);
const idleSeconds = Number(process.env.IDLE_SECONDS ?? 180);

const TABLE_INDEX = 3;
const TABLE_NAME = "LONGLIVED";
// valores-sentinela distintos de qualquer tentativa anterior (321/654 era a
// última gravada no índice 3), pra não ter dúvida se persistiu ou não.
const NU3_ROW =
  `NU3\t${TABLE_INDEX}\t${TABLE_NAME}\t\t50\tg\t\t` +
  `901,0\t0,0\t902,0\t0,0\t903,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t904,0\t0,0\t0,0\t0,0\t0,0\t0,0\t` +
  `\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\r\n`;

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  const socket = new Socket();
  socket.setEncoding("latin1");
  let buffer = "";

  socket.on("data", (chunk: string) => {
    buffer += chunk;
    console.log(">>> recv:", JSON.stringify(chunk));
  });
  socket.on("error", (err) => console.log("!!! erro:", err.message));

  await new Promise<void>((resolve, reject) => {
    socket.connect(port, ip, () => resolve());
    socket.once("error", reject);
  });
  console.log(`Conectado a ${ip}:${port}.`);

  buffer = "";
  socket.write("UPL\tINF\t\r\n", "latin1");
  await wait(1000);
  console.log("Handshake UPL/INF enviado (registro, como o painel de dispositivos faz).");

  console.log(`Mantendo conexão viva e IDLE por ${idleSeconds}s (round-trip UPL/TIM a cada 30s)...`);
  const rounds = Math.floor(idleSeconds / 30);
  for (let i = 0; i < rounds; i++) {
    await wait(30_000);
    buffer = "";
    socket.write("UPL\tTIM\t\r\n", "latin1");
    console.log(`  [${(i + 1) * 30}s] round-trip UPL/TIM enviado.`);
    await wait(500);
  }

  console.log("\nEnviando DWL/NU3 na MESMA conexão, agora que ela está 'velha'...");
  buffer = "";
  const body = `DWL\tNU3\t\r\n${NU3_ROW}END\tNU3\t\r\n` + `UPL\tTIM\t\r\n`;
  socket.write(body, "latin1");
  await wait(2000);
  console.log("Resposta acumulada após o write:", JSON.stringify(buffer));

  socket.write("UPL\tEND\t\r\n", "latin1");
  await wait(500);
  socket.destroy();

  console.log("\nFeito. Rode agora: npm run probe:nu3-dump (ou o script equivalente) pra conferir se o índice 3 mudou pra 'LONGLIVED' com valores 901/902/903/904.");
  process.exit(0);
})();
