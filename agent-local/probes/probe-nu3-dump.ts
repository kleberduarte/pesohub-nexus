import { Socket } from "net";

/**
 * Lê de volta o banco de tabelas nutricionais (NU3) da balança, mesmo padrão
 * de probe-plu-dump.ts mas pro verbo NU3, pra confirmar se o conteúdo de uma
 * tabela escrita via DWL/NU3 persistiu (não só o vínculo idx59 do PLU).
 *
 * Uso: SCALE_IP=192.168.15.5 npx ts-node --transpile-only src/probe-nu3-dump.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);

const socket = new Socket();
socket.setTimeout(8000);
socket.setEncoding("latin1");
let buffer = "";

socket.connect(port, ip, () => {
  socket.write("UPL\tNU3\t\r\n", "latin1");
});

socket.on("data", (chunk: string) => {
  buffer += chunk;
  if (buffer.includes("END\tNU3")) {
    const lines = buffer.split("\r\n").filter((l) => l.startsWith("NU3\t"));
    for (const line of lines) {
      const fields = line.split("\t");
      console.log(`\n=== NU3 registro (${fields.length} campos) ===`);
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
  console.log("Erro:", err.message);
  process.exit(1);
});
