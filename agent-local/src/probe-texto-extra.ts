import { sendProductsToScale, ScaleSyncPayload } from "./scale-client";

/**
 * Teste dos textos extras 2-7 (idx17-22 do PLU) recém-wired.
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-texto-extra.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

const produto: ScaleSyncPayload = {
  codigo: "801",
  codigoBarras: "",
  nome: "PROBE TEXTOS",
  preco: 1,
  textoExtra1: "T1",
  textoExtra2: "T2",
  textoExtra3: "T3",
  textoExtra4: "T4",
  textoExtra5: "T5",
  textoExtra6: "T6",
  textoExtra7: "T7",
};

(async () => {
  const outcome = await sendProductsToScale(ip, port, [produto]);
  console.log("Resultado:", outcome);
  process.exit(outcome.ok ? 0 : 1);
})();
