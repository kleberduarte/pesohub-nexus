import { Socket } from "net";
import { sendProductsToScale, ScaleSyncPayload } from "../src/scale-client";

/**
 * Testa o wiring novo de Imposto (idx57 TaxType / idx58 Tax do PLU):
 * escreve um PLU de teste com taxType=1 (soma por fora) e taxaImposto=18%
 * (deve virar Tax=180000 no wire), depois lê de volta via `UPL/PLU` (dump
 * completo, mesmo verbo usado em probe-plu-dump.ts) e confere os campos.
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-tax.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);
const TEST_CODIGO = "802";

const produto: ScaleSyncPayload = {
  codigo: TEST_CODIGO,
  codigoBarras: "",
  nome: "PROBE IMPOSTO",
  preco: 10,
  taxType: 1,
  taxaImposto: 18,
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
          console.log(`PLU com código "${TEST_CODIGO}" não encontrado no dump (${lines.length} registros totais).`);
        } else {
          const fields = match.split("\t");
          console.log(`\n=== PLU encontrado (${fields.length} campos) ===`);
          console.log(`  [57] TaxType = ${JSON.stringify(fields[57])} (esperado "1")`);
          console.log(`  [58] Tax     = ${JSON.stringify(fields[58])} (esperado "180000", = 18% * 10000)`);
        }
        socket.destroy();
        resolve();
      }
    });

    socket.on("timeout", () => {
      console.log("Timeout no dump. Buffer parcial:", JSON.stringify(buffer.slice(0, 500)));
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
