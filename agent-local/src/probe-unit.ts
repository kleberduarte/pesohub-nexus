import { Socket } from "net";
import { sendProductsToScale, ScaleSyncPayload } from "./scale-client";

/**
 * Testa o wiring novo de UnitID (idx4 do PLU): escreve dois PLUs de teste,
 * um com unidadeVenda=PESO (esperado idx4="1") e outro PECA (esperado "2"),
 * e lê de volta via `UPL/PLU` pra confirmar.
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-unit.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

const produtos: ScaleSyncPayload[] = [
  { codigo: "803", codigoBarras: "", nome: "PROBE PESO", preco: 5, unidadeVenda: "PESO" },
  { codigo: "804", codigoBarras: "", nome: "PROBE PECA", preco: 5, unidadeVenda: "PECA" },
];

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
        for (const codigo of ["803", "804"]) {
          const match = lines.find((l) => l.split("\t")[2] === codigo);
          if (!match) {
            console.log(`PLU com código "${codigo}" não encontrado no dump.`);
            continue;
          }
          const fields = match.split("\t");
          console.log(`Código ${codigo}: idx4 (UnitID) = ${JSON.stringify(fields[4])}, nome = ${JSON.stringify(fields[15])}`);
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
  console.log(`Escrevendo PLUs de teste em ${ip}:${port}...`);
  const outcome = await sendProductsToScale(ip, port, produtos);
  console.log("Resultado do write:", outcome);
  if (!outcome.ok) process.exit(1);

  await new Promise((r) => setTimeout(r, 500));
  console.log("Lendo de volta via UPL/PLU...");
  await dumpPlu();
  console.log("\nEsperado: código 803 (PESO) -> idx4=\"1\", código 804 (PECA) -> idx4=\"2\".");
  console.log(`Confira TAMBÉM fisicamente na balança (chame o PLU 803/804 no teclado) se a coluna Peso(kg)/pçs(un) muda de verdade.`);
  process.exit(0);
})();
