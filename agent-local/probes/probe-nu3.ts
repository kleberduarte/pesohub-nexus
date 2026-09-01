import { sendProductsToScale, ScaleSyncPayload } from "../src/scale-client";

/**
 * Testa o vínculo PLU -> tabela nutricional (DWL/NU3 + campo 59 do PLU) contra
 * a balança física, usando o mesmo cliente real (`sendProductsToScale`) que o
 * worker usa em produção — não uma reimplementação paralela do protocolo.
 *
 * Uso: SCALE_IP=192.168.15.6 npx ts-node --transpile-only src/probe-nu3.ts
 *
 * Depois de rodar, chame o PLU 601 na balança física e confira a tela de
 * informação nutricional (ou rode probe-plu-dump.ts pra ler o registro de
 * volta e conferir o idx59 == 3).
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);

const produto: ScaleSyncPayload = {
  codigo: "601",
  codigoBarras: "5901234123457",
  nome: "PROBE NU3",
  preco: 9.99,
  tabelaNutricional: {
    numero: 3,
    nome: "Probe NU3",
    porcao: "50g",
    porcoesPorEmbalagem: 4,
    itens: [
      { ordem: 1, valor: 111 }, // valor energético
      { ordem: 2, valor: 222 }, // carboidratos
      { ordem: 5, valor: 555 }, // proteínas
      { ordem: 10, valor: 100 }, // sódio
      { ordem: 11, valor: 777, ingrediente: "Cálcio" }, // extra
    ],
  },
};

(async () => {
  const outcome = await sendProductsToScale(ip, port, [produto]);
  console.log("Resultado do envio:", outcome);
  if (outcome.ok) {
    console.log(
      `PLU 601 + tabela nutricional 3 escritos. Chame o PLU 601 na balança e confira a tela; ` +
        `ou rode "npm run probe:plu-dump" e confira fields[59] === "3" no registro do PLU 601.`,
    );
  }
  process.exit(outcome.ok ? 0 : 1);
})();
