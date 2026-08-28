import { sendProductsToScale, ScaleSyncPayload } from "./scale-client";

/**
 * Teste da correção do campo idx57 faltante (2026-08-28): até agora
 * `buildNu3Row` gerava 57 campos, enquanto toda escrita real do software
 * oficial manda 58 (o registro termina com tab antes do CRLF, igual ao PLU).
 * Diff campo a campo contra uma escrita oficial que persistiu mostrou que essa
 * era a ÚNICA diferença entre as duas linhas.
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-nu3-trailing-field.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

const produto: ScaleSyncPayload = {
  codigo: "610",
  codigoBarras: "7891234567895",
  nome: "PROBE 58 CAMPOS",
  preco: 12.34,
  tabelaNutricional: {
    numero: 30,
    nome: "CAMPO58",
    porcao: "45g",
    porcoesPorEmbalagem: 6,
    itens: [
      { ordem: 1, valor: 543 },
      { ordem: 2, valor: 21 },
    ],
  },
};

(async () => {
  const outcome = await sendProductsToScale(ip, port, [produto]);
  console.log("Resultado do envio:", outcome);
  console.log("\nAgora rode probe-nu3-dump.ts — esperado: índice 30 'CAMPO58' com 543,0 / 21,0.");
  process.exit(outcome.ok ? 0 : 1);
})();
