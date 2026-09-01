import { Socket } from "net";
import { sendProductsToScale, ScaleSyncPayload } from "../src/scale-client";

/**
 * Testa o wiring novo de Angle/Align/Font por elemento de etiqueta (LAS):
 * escreve um formato de teste com um elemento angulo=90/alinhamento=2/fonte=3,
 * lê de volta via `UPL/LAB/<numero>` (ver probe-lab-single.ts) e confere se
 * os campos batem. NÃO confirma o efeito visual real na etiqueta impressa —
 * só que o valor persiste no protocolo, mesmo nível de confiança aceito pro
 * resto do wiring desta sessão.
 *
 * Uso: SCALE_IP=192.168.15.4 npx ts-node --transpile-only src/probe-lab-angle-align-font.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.4";
const port = Number(process.env.SCALE_PORT ?? 33581);
const LABEL_NUMERO = 21; // dentro da faixa 1-99 confirmada, fora dos oficiais (1-16) e do já usado em testes antigos (20)

const produto: ScaleSyncPayload = {
  codigo: "805",
  codigoBarras: "",
  nome: "PROBE LAB AAF",
  preco: 1,
  formatoImpressao: {
    numero: LABEL_NUMERO,
    nome: "PROBE AAF",
    larguraMm: 56,
    alturaMm: 90,
    elementos: [{ x: 5, y: 5, largura: 20, altura: 8, angulo: 90, alinhamento: 2, fonte: 3 }],
  },
};

function readLabel(): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    socket.setTimeout(8000);
    socket.setEncoding("latin1");
    let buffer = "";

    socket.connect(port, ip, () => {
      socket.write(`UPL\tLAB\t${LABEL_NUMERO}\t\r\n`, "latin1");
    });

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      if (buffer.includes("END\tLAB")) {
        console.log("\nResposta bruta:", JSON.stringify(buffer));
        const lasLine = buffer.split("\r\n").find((l) => l.startsWith("LAS\t"));
        if (!lasLine) {
          console.log("Nenhuma linha LAS encontrada no formato lido de volta.");
        } else {
          const fields = lasLine.split("\t");
          console.log(`\nLAS lido: SubID=${fields[1]} Flag1-3=${fields[2]}/${fields[3]}/${fields[4]} Print=${fields[5]}`);
          console.log(`  Angle=${fields[6]} (esperado "1", índice de giro de 90° pra 90°)`);
          console.log(`  Align=${fields[7]} (esperado "2")`);
          console.log(`  Font=${fields[8]} (esperado "3")`);
          console.log(`  Left/Top/Width/Height=${fields[9]}/${fields[10]}/${fields[11]}/${fields[12]}`);
        }
        socket.destroy();
        resolve();
      }
    });

    socket.on("timeout", () => {
      console.log("Timeout no read. Buffer parcial:", JSON.stringify(buffer.slice(0, 800)));
      resolve();
    });
    socket.on("error", (err) => reject(err));
  });
}

(async () => {
  console.log(`Escrevendo produto + formato de etiqueta ${LABEL_NUMERO} em ${ip}:${port}...`);
  const outcome = await sendProductsToScale(ip, port, [produto]);
  console.log("Resultado do write:", outcome);
  if (!outcome.ok) process.exit(1);

  await new Promise((r) => setTimeout(r, 500));
  console.log(`Lendo de volta o formato ${LABEL_NUMERO}...`);
  await readLabel();
  process.exit(0);
})();
