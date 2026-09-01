import { Socket } from "net";
import { buildNu3Row, TabelaNutricionalPayload } from "../src/scale-client";

/**
 * Nova hipótese, vinda da captura Wireshark+Procmon simultânea de uma escrita
 * REAL bem-sucedida do Ramuza.exe (2026-08-28, PLU FEIJAO): o bloco DWL/NU3
 * do software oficial sempre (1) começa com uma linha `NU3\t0\t...` zerada
 * (índice 0, template/reset) e (2) reenvia TODAS as tabelas nutricionais já
 * cadastradas de uma vez (7 tabelas na captura, não só a do produto sendo
 * salvo). Nossas tentativas anteriores (inclusive `probe-nu3-fragmented-write`,
 * que já incluía uma idx0 zerada) só mandavam 1-2 linhas de dados — nunca um
 * lote com idx0 + várias tabelas de uma vez. Este probe testa exatamente essa
 * combinação: idx0 + 4 tabelas (3 "existentes" fabricadas + 1 nova
 * verificável), tudo numa escrita só, sem fragmentação artificial.
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-nu3-idx0-fullbatch.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);

const idx0: TabelaNutricionalPayload = { numero: 0, nome: "", itens: [] };

const tabelas: TabelaNutricionalPayload[] = [
  idx0,
  {
    numero: 20,
    nome: "LOTE_A",
    porcao: "30g",
    porcoesPorEmbalagem: 5,
    itens: [
      { ordem: 1, valor: 100 },
      { ordem: 2, valor: 20 },
    ],
  },
  {
    numero: 21,
    nome: "LOTE_B",
    porcao: "40g",
    porcoesPorEmbalagem: 4,
    itens: [
      { ordem: 1, valor: 200 },
      { ordem: 2, valor: 30 },
    ],
  },
  {
    numero: 22,
    nome: "LOTE_C",
    porcao: "50g",
    porcoesPorEmbalagem: 3,
    itens: [
      { ordem: 1, valor: 300 },
      { ordem: 2, valor: 40 },
    ],
  },
  // idx23 é o marcador que vamos conferir depois com probe-nu3-dump.ts
  {
    numero: 23,
    nome: "MARCADOR",
    porcao: "60g",
    porcoesPorEmbalagem: 2,
    itens: [
      { ordem: 1, valor: 999 },
      { ordem: 2, valor: 88 },
    ],
  },
];

const body =
  `DWL\tNU3\t\r\n` + tabelas.map(buildNu3Row).join("") + `END\tNU3\t\r\n` + `UPL\tTIM\t\r\n`;

(async () => {
  const socket = new Socket();
  socket.setEncoding("latin1");
  let buffer = "";
  socket.on("data", (chunk: string) => {
    buffer += chunk;
    console.log(">>> resposta:", JSON.stringify(chunk));
  });
  socket.on("error", (err) => console.log("Erro:", err.message));

  await new Promise<void>((resolve, reject) => {
    socket.connect(port, ip, () => resolve());
    socket.once("error", reject);
  });
  console.log(`Conectado a ${ip}:${port}. Escrevendo lote idx0+20+21+22+23 numa chamada write() só...`);
  socket.write(body, "latin1");

  await new Promise((r) => setTimeout(r, 2500));
  socket.destroy();
  console.log("\nConexão encerrada. Rode probe-nu3-dump.ts pra conferir se idx23 'MARCADOR'/999,0 persistiu.");
  process.exit(0);
})();
