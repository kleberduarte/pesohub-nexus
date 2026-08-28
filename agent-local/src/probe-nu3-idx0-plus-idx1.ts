import { Socket } from "net";

/**
 * Replica byte-a-byte o único DWL/NU3 que comprovadamente persistiu na
 * balança física (capturado do Ramuza.exe em captura06.json, pacote de
 * 2026-08-27 23:02:28 UTC): um write que manda DOIS registros de uma vez —
 * índice 0 totalmente zerado (nome vazio) + índice 1 com nome vazio e
 * apenas idx9="99,0" preenchido — seguido de END/NU3 e UPL/TIM.
 *
 * Hipótese: talvez a balança só aceite/persista escritas de NU3 que venham
 * em par com o índice 0, ou que sigam esse formato mínimo (nome vazio,
 * só um campo numérico preenchido) em vez de um registro "cheio" como os
 * que o PesoHub sempre mandou.
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-nu3-idx0-plus-idx1.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

// Byte-a-byte idêntico ao decodificado da captura (idx9 trocado pra 88,0
// em vez de 99,0 só pra termos um marcador distinto e confirmar que foi
// ESSA escrita que persistiu, não coincidência com o estado já existente).
const ROW0 =
  "NU3\t0\t\t\t0\t\t\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0";
const ROW1 =
  "NU3\t1\t\t\t0\t\t\t0,0\t0,0\t88,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0\t\t0,0\t0,0";

const body = `DWL\tNU3\t\r\n${ROW0}\r\n${ROW1}\r\nEND\tNU3\t\r\n\r\nUPL\tTIM\t\r\n`;

console.log("Enviando (idêntico à captura, idx9=88,0 como marcador):\n" + body.replace(/\r\n/g, "\\r\\n\n"));

const socket = new Socket();
socket.setTimeout(8000);
socket.setEncoding("latin1");
let buffer = "";

socket.connect(port, ip, () => {
  socket.write(body, "latin1");
});

socket.on("data", (chunk: string) => {
  buffer += chunk;
  console.log(">>> resposta:", JSON.stringify(chunk));
});

socket.on("timeout", () => {
  console.log("\nTimeout. Buffer completo:", JSON.stringify(buffer));
  socket.destroy();
  process.exit(0);
});

socket.on("error", (err) => {
  console.log("Erro:", err.message);
  process.exit(1);
});

socket.on("close", () => {
  console.log("\nConexão fechada. Rode probe-nu3-dump.ts pra conferir se idx9 do índice 1 virou 88,0.");
  process.exit(0);
});
