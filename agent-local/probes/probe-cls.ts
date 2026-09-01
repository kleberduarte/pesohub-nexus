import { Socket } from "net";
import { sendProductsToScale, ScaleSyncPayload } from "../src/scale-client";

/**
 * Testa o wiring novo de Setor/ClassID (idx14 do PLU + bloco DWL/CLS novo):
 * escreve um PLU vinculado a um Setor de teste e lê de volta via `UPL/PLU`
 * (idx14) e `UPL/CLS` (dump completo, sem verbo filtrado conhecido ainda).
 *
 * Uso: SCALE_IP=192.168.15.4 CLASS_NUM=20 npx ts-node --transpile-only src/probe-cls.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);
const CLASS_NUM = Number(process.env.CLASS_NUM ?? 20);
const TEST_CODIGO = "807";

const produto: ScaleSyncPayload = {
  codigo: TEST_CODIGO,
  codigoBarras: "",
  nome: "PROBE SETOR",
  preco: 1,
  setor: { numero: CLASS_NUM, nome: "PROBE CLS" },
};

function dumpAndCheck(): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    socket.setTimeout(8000);
    socket.setEncoding("latin1");
    let buffer = "";
    let stage: "cls" | "plu" = "cls";

    socket.connect(port, ip, () => {
      socket.write(`UPL\tCLS\t\r\n`, "latin1");
    });

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      if (stage === "cls" && buffer.includes("END\tCLS")) {
        const lines = buffer.split("\r\n").filter((l) => l.startsWith("CLS\t"));
        const match = lines.find((l) => l.split("\t")[1] === String(CLASS_NUM));
        console.log(`\n=== UPL/CLS (${lines.length} classes no total) ===`);
        console.log(match ? `Class ${CLASS_NUM} encontrada: ${JSON.stringify(match)}` : `Class ${CLASS_NUM} NÃO encontrada — não persistiu.`);
        buffer = "";
        stage = "plu";
        socket.write(`UPL\tPLU\t\r\n`, "latin1");
        return;
      }
      if (stage === "plu" && buffer.includes("END\tPLU")) {
        const lines = buffer.split("\r\n").filter((l) => l.startsWith("PLU\t"));
        const match = lines.find((l) => l.split("\t")[2] === TEST_CODIGO);
        if (!match) {
          console.log(`PLU "${TEST_CODIGO}" não encontrado.`);
        } else {
          const fields = match.split("\t");
          console.log(`\n=== PLU encontrado ===`);
          console.log(`  [14] ClassID = ${JSON.stringify(fields[14])} (esperado "${CLASS_NUM}")`);
        }
        socket.destroy();
        resolve();
      }
    });

    socket.on("timeout", () => {
      console.log("Timeout. Buffer parcial:", JSON.stringify(buffer.slice(0, 500)));
      resolve();
    });
    socket.on("error", (err) => reject(err));
  });
}

(async () => {
  console.log(`Escrevendo PLU + Class ${CLASS_NUM} em ${ip}:${port}...`);
  const outcome = await sendProductsToScale(ip, port, [produto]);
  console.log("Resultado do write:", outcome);
  if (!outcome.ok) process.exit(1);

  await new Promise((r) => setTimeout(r, 500));
  await dumpAndCheck();
  process.exit(0);
})();
