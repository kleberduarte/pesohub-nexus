import { sendProductsToScale, ScaleSyncPayload } from "./scale-client";

/**
 * Reteste do bug de persistência do NU3, agora reaproveitando o índice 1
 * (que ficou como "casco vazio" após a tabela antiga ter sido excluída do
 * banco do PesoHub, mas nunca excluída de fato da balança).
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-nu3-idx1-retest.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

const produto: ScaleSyncPayload = {
  codigo: "601",
  codigoBarras: "5901234123457",
  nome: "PROBE NU3",
  preco: 9.99,
  tabelaNutricional: {
    numero: 1,
    nome: "RETEST IDX1",
    porcao: "50g",
    porcoesPorEmbalagem: 4,
    itens: [
      { ordem: 1, valor: 111 },
      { ordem: 2, valor: 222 },
      { ordem: 5, valor: 555 },
      { ordem: 10, valor: 100 },
      { ordem: 11, valor: 777, ingrediente: "Cálcio" },
    ],
  },
};

(async () => {
  const outcome = await sendProductsToScale(ip, port, [produto]);
  console.log("Resultado do envio:", outcome);
  process.exit(outcome.ok ? 0 : 1);
})();
