/**
 * Probe: envia um bitmap de teste (moldura + X na diagonal) pro slot informado
 * e lê de volta, pra validar o bloco `DWL/BMP` contra o hardware.
 * Uso: SCALE_IP=192.168.15.7 BMP_ID=1 npx ts-node --transpile-only src/probe-bmp.ts
 */
import { Socket } from "net";
import { buildBmpBlock, type BitmapMonocromatico } from "../src/bitmap-wire";

const ip = process.env.SCALE_IP ?? "192.168.15.7";
const port = Number(process.env.SCALE_PORT ?? 33581);
const id = Number(process.env.BMP_ID ?? 1);

function bitmapTeste(largura: number, altura: number): BitmapMonocromatico {
  const pixels = new Uint8Array(largura * altura);
  const set = (x: number, y: number) => {
    if (x >= 0 && x < largura && y >= 0 && y < altura) pixels[y * largura + x] = 1;
  };
  for (let x = 0; x < largura; x++) { set(x, 0); set(x, altura - 1); }
  for (let y = 0; y < altura; y++) { set(0, y); set(largura - 1, y); }
  for (let i = 0; i < Math.min(largura, altura); i++) {
    set(Math.round((i * (largura - 1)) / (altura - 1)), i);
    set(largura - 1 - Math.round((i * (largura - 1)) / (altura - 1)), i);
  }
  return { largura, altura, pixels };
}

function conversa(payload: string, ms: number): Promise<string> {
  return new Promise((resolve) => {
    const s = new Socket();
    let buf = "";
    s.connect(port, ip, () => s.write(payload));
    s.on("data", (d) => (buf += d.toString("latin1")));
    s.on("error", (e) => { console.error("erro:", e.message); resolve(buf); });
    setTimeout(() => { s.destroy(); resolve(buf); }, ms);
  });
}

(async () => {
  const bmp = bitmapTeste(96, 32);
  const bloco = buildBmpBlock(new Map([[id, bmp]]));
  console.log(`enviando BMP id=${id} ${bmp.largura}x${bmp.altura} (payload ${bloco.length} chars)`);
  const ack = await conversa(bloco + "UPL\tTIM\t\r\n", 6000);
  console.log("ack:", JSON.stringify(ack.slice(0, 160)));

  const back = await conversa(`UPL\tBMP\t\r\n`, 8000);
  const linha = back.split("\r\n").find((l) => l.startsWith(`BMP\t${id}\t`));
  if (!linha) {
    console.log("NAO persistiu — resposta:", JSON.stringify(back.slice(0, 300)));
  } else {
    const payloadEnviado = bloco.split("\r\n")[1].split("\t")[2];
    const payloadLido = linha.split("\t")[2];
    console.log(`persistiu. enviado=${payloadEnviado.length} chars, lido=${payloadLido.length} chars`);
    console.log("igual?", payloadLido === payloadEnviado);
    if (payloadLido !== payloadEnviado) {
      console.log("enviado[0..80]:", payloadEnviado.slice(0, 80));
      console.log("lido   [0..80]:", payloadLido.slice(0, 80));
    }
  }
  process.exit(0);
})();
