import { Socket } from "net";

/**
 * Testa o candidato pra "unidade de venda" (índice 4): grava um PLU com idx4=2
 * (o único valor visto em registros reais até agora é "1") e pede pra conferir
 * na tela de pesagem se a coluna "Peso(kg)/pçs(un)" muda de kg pra unidades.
 *
 * Uso: SCALE_IP=192.168.15.6 npx ts-node --transpile-only src/probe-unidade-venda.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);
const TEST_PLU = "600";

const PLU_FIELD_TEMPLATE = [
  "PLU", TEST_PLU, TEST_PLU, "5901234123457", "2", "1234,2", "0,0", "0,0", "0", "0", "0", "0", "0", "0", "9",
  "PROBE UNIDADE PECA", "", "", "", "", "", "", "", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",
  "0", "0", "0,0", "0,0", "0", "127", "0,0", "0,0", "0,0", "0", "127", "0,0", "0,0", "0,0",
  "0", "127", "0,0", "0,0", "0,0", "0", "127", "0,0", "0,0", "0,0", "0", "0", "0", "0", "0",
  "0", "0", "teste", "0", "0", "0", "",
];

const socket = new Socket();
socket.setTimeout(10_000);
socket.setEncoding("latin1");
let buffer = "";

socket.connect(port, ip, () => {
  const body = `DWL\tPLU\t\r\n` + PLU_FIELD_TEMPLATE.join("\t") + "\r\n" + `END\tPLU\t\r\n` + `UPL\tTIM\t\r\n`;
  socket.write(body, "latin1");
});

socket.on("data", (chunk: string) => {
  buffer += chunk;
  if (buffer.includes("END\tTIM")) {
    socket.write("UPL\tEND\t\r\n", "latin1", () => {
      console.log(`PLU ${TEST_PLU} escrito com idx4=2. Chame o PLU ${TEST_PLU} na balança e veja a tela.`);
      socket.destroy();
      process.exit(0);
    });
  }
});

socket.on("timeout", () => {
  console.log("timeout");
  process.exit(1);
});
socket.on("error", (err) => {
  console.log("erro:", err.message);
  process.exit(1);
});
