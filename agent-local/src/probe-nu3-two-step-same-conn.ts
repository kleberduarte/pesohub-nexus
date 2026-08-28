import { Socket } from "net";

/**
 * Replica o padrão REAL descoberto em captura06.json (não o que tínhamos
 * tentado antes): o Ramuza.exe fez DUAS escritas DWL/NU3 separadas, na
 * MESMA conexão TCP, com ~46s de intervalo (só um heartbeat UPL/TIM entre
 * elas):
 *   1) 23:29:42 — DWL/NU3 só com índice 0 (zerado)
 *   2) 23:30:28 (+46s) — DWL/NU3 reenviando índice 0 + o índice 1 novo
 *      (idx9="99,0") — essa segunda escrita foi a que persistiu.
 *
 * Testes anteriores sempre mandaram tudo numa escrita só, numa conexão
 * nova. Aqui replicamos: mesma conexão, 2 writes, ~46s de intervalo,
 * heartbeat TIM no meio (mesmo que a balança não peça, o software oficial
 * mandou um).
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-nu3-two-step-same-conn.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

const ROW0 =
  "NU3\t0\t\t\t0\t\t\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0";
// idx9 = 77,0 como marcador distinto (nunca visto antes: nem 99,0 nem 88,0)
const ROW1 =
  "NU3\t1\t\t\t0\t\t\t0,0\t0,0\t77,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0";

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  const socket = new Socket();
  socket.setEncoding("latin1");
  let buffer = "";
  socket.on("data", (chunk: string) => {
    buffer += chunk;
    console.log(">>> resposta:", JSON.stringify(chunk));
  });
  socket.on("error", (err) => console.log("Erro:", err.message));

  await new Promise<void>((resolve, reject) => {
    socket.connect(port, ip, () => resolve());
    socket.once("error", reject);
  });
  console.log(`Conectado a ${ip}:${port}.`);

  console.log("\n[t+0s] Escrita 1: DWL/NU3 só índice 0...");
  buffer = "";
  socket.write(`DWL\tNU3\t\r\n${ROW0}\r\nEND\tNU3\t\r\n\r\n`, "latin1");
  await wait(1000);

  console.log("\n[t+~15s] Heartbeat UPL/TIM (imitando o real)...");
  await wait(14000);
  buffer = "";
  socket.write("UPL\tTIM\t\r\n", "latin1");
  await wait(1000);

  console.log("\n[t+~46s] Escrita 2: DWL/NU3 índice 0 + índice 1 (idx9=77,0)...");
  await wait(30000);
  buffer = "";
  socket.write(`DWL\tNU3\t\r\n${ROW0}\r\n${ROW1}\r\nEND\tNU3\t\r\n\r\n`, "latin1");
  await wait(1500);

  console.log("\n[fim] UPL/TIM final...");
  buffer = "";
  socket.write("UPL\tTIM\t\r\n", "latin1");
  await wait(1000);

  socket.destroy();
  console.log("\nConexão encerrada. Rode probe-nu3-dump.ts pra conferir se idx9 do índice 1 virou 77,0.");
  process.exit(0);
})();
