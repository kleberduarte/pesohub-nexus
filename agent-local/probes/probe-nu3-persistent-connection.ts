import { Socket } from "net";

/**
 * Testa a hipótese da captura06.json (ver [[project_scale_protocol_field_gap]]):
 * a única escrita DWL/NU3 comprovadamente bem-sucedida até agora veio de uma
 * conexão TCP que ficou aberta por ~28 minutos, com bastante atividade real
 * (handshake INF, TIM periódico, DWL/TMS, múltiplas escritas DWL/PLU) antes da
 * escrita do NU3 — não uma conexão nova de curta duração como todos os
 * testes anteriores (inclusive o "long-lived" de 3 minutos, que falhou).
 *
 * Este script simula esse padrão pelo lado do PesoHub: conexão única, BOM +
 * handshake INF/END uma vez, heartbeat UPL/TIM a cada 30s, e uma escrita
 * DWL/PLU real a cada ~3 minutos (produto de teste incrementando), pelos
 * primeiros ~25 minutos — só então tenta o DWL/NU3 com um valor novo.
 *
 * Uso: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-persistent-connection.ts
 * (roda em background — checar o log; demora ~25-28 minutos até a escrita do NU3)
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);
const WARMUP_MINUTES = Number(process.env.WARMUP_MINUTES ?? 26);

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

(async () => {
  const socket = new Socket();
  let raw = Buffer.alloc(0);
  socket.on("data", (chunk: Buffer) => {
    raw = Buffer.concat([raw, chunk]);
  });
  socket.on("error", (err) => log(`!!! erro de socket: ${err.message}`));
  socket.on("close", () => log("!!! conexão fechada pela balança"));

  await new Promise<void>((resolve, reject) => {
    socket.connect(port, ip, () => resolve());
    socket.once("error", reject);
  });
  log(`Conectado a ${ip}:${port}. Iniciando aquecimento de ${WARMUP_MINUTES} minutos...`);

  socket.write(UTF8_BOM);
  await wait(300);
  raw = Buffer.alloc(0);
  socket.write(Buffer.from("\r\nUPL\tINF\t\r\n", "latin1"));
  await wait(1000);
  if (raw.toString("latin1").includes("END\tINF")) {
    socket.write(Buffer.from("UPL\tEND\t\r\n", "latin1"));
    log("Handshake INF/END concluído.");
  } else {
    log("AVISO: anúncio DWL/INF não veio — seguindo mesmo assim.");
  }
  await wait(500);

  const totalMs = WARMUP_MINUTES * 60_000;
  const heartbeatIntervalMs = 30_000;
  const plUWriteIntervalMs = 3 * 60_000;
  const start = Date.now();
  let lastPluWrite = 0;
  let pluCounter = 0;

  while (Date.now() - start < totalMs) {
    await wait(heartbeatIntervalMs);
    socket.write(Buffer.from("UPL\tTIM\t\r\n", "latin1"));
    const elapsedMin = ((Date.now() - start) / 60000).toFixed(1);
    log(`[aquecimento ${elapsedMin}/${WARMUP_MINUTES}min] heartbeat UPL/TIM`);

    if (Date.now() - lastPluWrite >= plUWriteIntervalMs) {
      lastPluWrite = Date.now();
      pluCounter++;
      // Escrita real de PLU (produto de teste 8888), igual ao que um sync
      // normal do PesoHub faria — pra dar atividade real à conexão, não só
      // heartbeat vazio.
      const pluRow =
        `PLU\t8888\t8888\t\t1\t${pluCounter},0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\tAQUECIMENTO ${pluCounter}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tteste\t0\t0\t0\t\r\n`;
      socket.write(Buffer.from(`DWL\tPLU\t\r\n${pluRow}END\tPLU\t\r\n`, "latin1"));
      log(`[aquecimento] escrita real DWL/PLU #${pluCounter} (produto teste 8888)`);
    }
  }

  log("Aquecimento concluído. Enviando DWL/NU3 com valor novo (tabela 1, energético=777)...");
  const nu3Row =
    "NU3\t1\tPERSISTENT CONN\t\t50\tg\t\t777,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t" +
    "\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\r\n";
  raw = Buffer.alloc(0);
  socket.write(Buffer.from(`DWL\tNU3\t\r\n${nu3Row}END\tNU3\t\r\n\r\nUPL\tTIM\t\r\n`, "latin1"));
  await wait(2000);
  log(`Resposta ao write NU3: ${JSON.stringify(raw.toString("latin1"))}`);

  socket.write(Buffer.from("UPL\tEND\t\r\n", "latin1"));
  await wait(500);
  socket.destroy();

  log("Feito. Rode probe-nu3-dump.ts e confira o índice 1 (esperado: 'PERSISTENT CONN', 777,0).");
  process.exit(0);
})();
