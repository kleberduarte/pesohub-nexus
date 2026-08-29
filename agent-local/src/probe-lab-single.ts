import { Socket } from "net";

/**
 * Tenta ler só UM formato de etiqueta específico, por analogia com o padrão
 * de leitura filtrada de outros verbos (`UPL\tPLU\t<numero>\t`, `UPL\tNU3\t<numero>\t`).
 *
 * Uso: SCALE_IP=192.168.15.4 LABEL_ID=500 npx ts-node --transpile-only src/probe-lab-single.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);
const labelId = process.env.LABEL_ID ?? "500";

const socket = new Socket();
socket.setTimeout(8000);
socket.setEncoding("latin1");
let buffer = "";

socket.connect(port, ip, () => {
  socket.write(`UPL\tLAB\t${labelId}\t\r\n`, "latin1");
});

socket.on("data", (chunk: string) => {
  buffer += chunk;
  if (buffer.includes("END\tLAB")) {
    console.log(JSON.stringify(buffer));
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
