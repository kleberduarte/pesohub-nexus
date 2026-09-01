import { sendProductsToScale } from "./scale-client";
import { Socket } from "net";

/**
 * Valida o caminho de "formato avulso" do card #51: salvar um layout que
 * NENHUM produto usa e confirmar que ele chega na balança. Estava provado por
 * teste automatizado e pelo caminho do worker, mas nunca contra o hardware —
 * e este projeto já perdeu sessões inteiras para descarte silencioso, então
 * ACK não é prova: aqui a gente escreve e lê de volta.
 *
 * Uso: SCALE_IP=<ip> npx ts-node --transpile-only src/probe-lab-avulso.ts
 */
const ip = process.env.SCALE_IP!;
const port = Number(process.env.SCALE_PORT ?? 33581);
const SLOT = Number(process.env.LAB_SLOT ?? 40);

const formato = {
  numero: SLOT,
  nome: "AVULSO 51",
  larguraMm: 60,
  alturaMm: 40,
  elementos: [
    { tipo: "nome", x: 3, y: 2, largura: 50, altura: 4, fonte: 11, alinhamento: 1 },
    { tipo: "preco", x: 3, y: 10, largura: 50, altura: 6, fonte: 13, alinhamento: 2 },
  ],
};

function lerSlot(numero: number): Promise<string | null> {
  return new Promise((resolve) => {
    const s = new Socket();
    s.setTimeout(10000);
    s.setEncoding("latin1");
    let buf = "";
    s.connect(port, ip, () => s.write(`UPL\tLAB\t${numero}\t\r\n`, "latin1"));
    s.on("data", (c: string) => {
      buf += c;
      if (buf.includes("END\tLAB")) {
        s.destroy();
        resolve(buf.split("\r\n").find((l) => l.startsWith(`LAB\t${numero}\t`)) ?? null);
      }
    });
    s.on("timeout", () => { s.destroy(); resolve(null); });
    s.on("error", () => resolve(null));
  });
}

(async () => {
  console.log(`Antes  (slot ${SLOT}):`, (await lerSlot(SLOT)) ?? "<vazio>");

  // Nenhum produto — só o formato avulso. Este é o cenário do card.
  const outcome = await sendProductsToScale(ip, port, [], [formato as never]);
  console.log("Envio:", JSON.stringify(outcome));

  const depois = await lerSlot(SLOT);
  console.log(`Depois (slot ${SLOT}):`, depois ?? "<vazio>");
  console.log(depois ? "OK: o formato avulso persistiu na balança." : "FALHA: nada persistiu — descarte silencioso.");
  process.exit(depois ? 0 : 1);
})();
