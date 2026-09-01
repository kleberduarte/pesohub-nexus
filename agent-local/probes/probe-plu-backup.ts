import { Socket } from "net";
import { writeFileSync } from "fs";

/**
 * Baixa TODOS os PLUs da balança para um arquivo, em latin1, byte a byte como
 * vieram do wire.
 *
 * Existe por causa de uma descoberta de 2026-09-01: uma linha de LEITURA (69
 * campos) pode ser reescrita via `DWL/PLU` verbatim e o registro volta
 * idêntico. Ou seja, este dump é um backup de verdade — dá pra restaurar sem
 * passar por `buildPluRow`, que só conhece ~14% dos campos e devolveria os
 * outros no default.
 *
 * É o que transforma um comando destrutivo (`CLR/PLU`) de aposta em operação
 * reversível. Rodar ANTES de qualquer escrita em massa.
 *
 * Uso: SCALE_IP=<ip> OUT=<arquivo> npx ts-node --transpile-only src/probe-plu-backup.ts
 */
const ip = process.env.SCALE_IP!;
const port = Number(process.env.SCALE_PORT ?? 33581);
const out = process.env.OUT ?? `plus-backup-${new Date().toISOString().slice(0, 10)}.txt`;

const s = new Socket();
s.setTimeout(20000);
s.setEncoding("latin1");
let buf = "";

s.connect(port, ip, () => s.write("UPL\tPLU\t\r\n", "latin1"));
s.on("data", (c: string) => {
  buf += c;
  if (!buf.includes("END\tPLU")) return;
  const linhas = buf.split("\r\n").filter((l) => l.startsWith("PLU\t"));
  writeFileSync(out, buf, { encoding: "latin1" });
  console.log(`${linhas.length} PLUs salvos em ${out}`);
  console.log("numeros:", linhas.map((l) => l.split("\t")[1]).join(","));
  s.destroy();
  process.exit(0);
});
s.on("timeout", () => { console.error("timeout — nada salvo"); process.exit(1); });
s.on("error", (e) => { console.error("erro:", e.message); process.exit(1); });
