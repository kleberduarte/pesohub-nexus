import { Socket } from "net";

/**
 * Tenta comandos candidatos de LEITURA de configuração (rede/Wi-Fi/Ethernet)
 * no protocolo TXT-MODE já mapeado (verbo\tsubstantivo\t...\r\n, ex.: DWL/PLU,
 * UPL/TIM, UPL/END em scale-client.ts). Não sabemos o verbo exato para "ler
 * config de rede", então testamos variações plausíveis e logamos qualquer
 * resposta em hexdump + ASCII para inspeção manual.
 *
 * Uso: SCALE_IP=192.168.15.6 SCALE_PORT=33581 npx ts-node --transpile-only src/probe-network-config.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);

function hexdump(buf: Buffer): string {
  const hex = buf.toString("hex").match(/.{1,2}/g)?.join(" ") ?? "";
  const ascii = [...buf].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
  return `HEX: ${hex}\nASCII: ${ascii}`;
}

const nouns = ["CFG", "PAR", "NET", "ETH", "WIFI", "WLAN", "IP", "REDE", "SYS", "INFO"];
const verbs = ["UPL", "DWL", "REQ", "GET"];

const candidates: Array<{ label: string; bytes: Buffer }> = [];
for (const v of verbs) {
  for (const n of nouns) {
    const line = `${v}\t${n}\t\r\n`;
    candidates.push({ label: `${v}/${n}`, bytes: Buffer.from(line, "ascii") });
  }
}

async function tryCandidate(label: string, bytes: Buffer): Promise<void> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(2500);
    let gotData = false;

    socket.connect(port, ip, () => {
      socket.write(bytes, "latin1");
    });

    socket.on("data", (data: Buffer) => {
      gotData = true;
      console.log(`\n>>> [${label}] RESPOSTA (${data.length} bytes):`);
      console.log(hexdump(data));
    });

    socket.on("timeout", () => {
      if (!gotData) console.log(`[${label}] sem resposta.`);
      socket.destroy();
      resolve();
    });

    socket.on("error", (err) => {
      console.log(`[${label}] erro: ${err.message}`);
      resolve();
    });

    socket.on("close", () => resolve());
  });
}

(async () => {
  console.log(`Testando ${candidates.length} comandos candidatos de config contra ${ip}:${port}...`);
  for (const c of candidates) {
    await tryCandidate(c.label, c.bytes);
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log("\nFim dos testes. Se ALGUM comando retornou dados (não 'sem resposta'), copie a saída completa.");
  process.exit(0);
})();
