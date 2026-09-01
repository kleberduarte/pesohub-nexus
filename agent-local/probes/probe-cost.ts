import { Socket } from "net";
import { sendProductsToScale, ScaleSyncPayload } from "../src/scale-client";

/**
 * Testa o wiring novo de Cost (idx6 do PLU): escreve um PLU com custo=R$3,45
 * (mesma codificação compacta do preço/tara) e lê de volta via `UPL/PLU`.
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-cost.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);
const TEST_CODIGO = "806";

const produto: ScaleSyncPayload = {
  codigo: TEST_CODIGO,
  codigoBarras: "",
  nome: "PROBE CUSTO",
  preco: 10,
  custo: 3.45,
};

function dumpPlu(): Promise<void> {
  return new Promise((resolve, reject) => {
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
        const match = lines.find((l) => l.split("\t")[2] === TEST_CODIGO);
        if (!match) {
          console.log(`PLU com código "${TEST_CODIGO}" não encontrado no dump.`);
        } else {
          const fields = match.split("\t");
          console.log(`\n=== PLU encontrado ===`);
          console.log(`  [5] Price = ${JSON.stringify(fields[5])}`);
          console.log(`  [6] Cost  = ${JSON.stringify(fields[6])} (esperado "345,2", = 3.45 codificado igual ao preço)`);
        }
        socket.destroy();
        resolve();
      }
    });

    socket.on("timeout", () => {
      console.log("Timeout no dump.");
      resolve();
    });
    socket.on("error", (err) => reject(err));
  });
}

(async () => {
  console.log(`Escrevendo PLU de teste em ${ip}:${port}...`);
  const outcome = await sendProductsToScale(ip, port, [produto]);
  console.log("Resultado do write:", outcome);
  if (!outcome.ok) process.exit(1);

  await new Promise((r) => setTimeout(r, 500));
  console.log("Lendo de volta via UPL/PLU...");
  await dumpPlu();
  process.exit(0);
})();
