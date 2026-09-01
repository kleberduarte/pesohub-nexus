import { Socket } from "net";

/**
 * Ferramenta de diagnóstico: conecta na balança e mostra em hexdump qualquer
 * byte que ela mandar, para ajudar a decifrar o protocolo TXT-MODE (JHScale)
 * já que não temos a especificação de baixo nível — só o manual do software.
 *
 * Rode isso a partir de uma máquina que esteja na MESMA sub-rede da balança
 * (ex: 10.10.40.x), senão vai dar timeout de conexão.
 *
 * Uso: SCALE_IP=10.10.40.35 SCALE_PORT=33581 npm run probe
 */
const ip = process.env.SCALE_IP ?? "10.10.40.35";
const port = Number(process.env.SCALE_PORT ?? 33581);

function hexdump(buf: Buffer): string {
  const hex = buf.toString("hex").match(/.{1,2}/g)?.join(" ") ?? "";
  const ascii = [...buf].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
  return `HEX: ${hex}\nASCII: ${ascii}`;
}

console.log(`Conectando em ${ip}:${port}...`);

const socket = new Socket();
socket.setTimeout(10_000);

socket.connect(port, ip, () => {
  console.log("Conectado. Aguardando dados da balança por 5s...");
});

socket.on("data", (data: Buffer) => {
  console.log(`\n--- ${data.length} bytes recebidos ---`);
  console.log(hexdump(data));
});

socket.on("timeout", () => {
  console.log("Timeout — nenhum byte recebido / conexão não respondeu.");
  socket.destroy();
  process.exit(1);
});

socket.on("error", (err) => {
  console.error("Erro de conexão:", err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log("\nFechando conexão de diagnóstico.");
  socket.end();
  process.exit(0);
}, 8000);
