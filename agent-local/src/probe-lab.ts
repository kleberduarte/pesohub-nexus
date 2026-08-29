import { sendProductsToScale, ScaleSyncPayload } from "./scale-client";

/**
 * Teste do bloco DWL/LAB (formato de etiqueta) — confirmado persistindo no
 * hardware físico em 2026-08-28 com `numero` dentro da faixa válida 1-99
 * (fora disso, ACK normal mas descarte silencioso — ver
 * [[project_ramuza_full_field_map_2026_08_28]]).
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-lab.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

const produto: ScaleSyncPayload = {
  codigo: "800",
  codigoBarras: "",
  nome: "PROBE LAB",
  preco: 9.99,
  formatoImpressao: {
    numero: 20,
    nome: "TESTE LAB",
    larguraMm: 60,
    alturaMm: 120,
    elementos: [
      { x: 5, y: 3, largura: 50, altura: 8 },
      { x: 5, y: 12, largura: 50, altura: 8 },
    ],
  },
};

(async () => {
  const outcome = await sendProductsToScale(ip, port, [produto]);
  console.log("Resultado:", outcome);
  process.exit(outcome.ok ? 0 : 1);
})();
