import { sendProductsToScale, ScaleSyncPayload } from "./scale-client";

/**
 * Reteste da hipótese de sessão única: agora com certeza de que nenhum
 * outro cliente (Ramuza.exe fechado) está conectado à balança, tenta
 * gravar via o mesmo client real do PesoHub.
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-nu3-alone-retest.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

const produto: ScaleSyncPayload = {
  codigo: "601",
  codigoBarras: "5901234123457",
  nome: "PROBE NU3",
  preco: 9.99,
  tabelaNutricional: {
    numero: 2,
    nome: "SESSAO UNICA",
    porcao: "60g",
    porcoesPorEmbalagem: 3,
    itens: [
      { ordem: 1, valor: 321 },
      { ordem: 2, valor: 654 },
    ],
  },
};

(async () => {
  const outcome = await sendProductsToScale(ip, port, [produto]);
  console.log("Resultado do envio:", outcome);
  process.exit(outcome.ok ? 0 : 1);
})();
