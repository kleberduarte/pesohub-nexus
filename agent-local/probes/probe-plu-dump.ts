import { Socket } from "net";

/**
 * Usa o verbo de leitura descoberto (UPL/PLU sem número = dump completo do
 * banco de PLUs da balança) e imprime cada registro com índice de campo,
 * pra decodificar o PLU_FIELD_TEMPLATE de scale-client.ts campo a campo
 * contra dados reais (incluindo PLUs cadastrados pelo software/teclado
 * oficial, não só os que o PesoHub escreveu).
 *
 * Uso: SCALE_IP=192.168.15.6 npx ts-node --transpile-only src/probe-plu-dump.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);

const socket = new Socket();
socket.setTimeout(8000);
socket.setEncoding("latin1");
let buffer = "";

socket.connect(port, ip, () => {
  socket.write("UPL\tPLU\t\r\n", "latin1");
});

socket.on("data", (chunk: string) => {
  buffer += chunk;
  if (buffer.includes("END\tPLU")) {
    const lines = buffer.split("\r\n").filter((l) => l.startsWith("PLU\t"));
    for (const line of lines) {
      const fields = line.split("\t");
      console.log(`\n=== PLU registro (${fields.length} campos) ===`);
      fields.forEach((f, i) => console.log(`  [${i}] ${JSON.stringify(f)}`));
    }
    socket.destroy();
    process.exit(0);
  }
});

socket.on("timeout", () => {
  console.log("Timeout. Buffer parcial:", JSON.stringify(buffer));
  process.exit(1);
});

socket.on("error", (err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
