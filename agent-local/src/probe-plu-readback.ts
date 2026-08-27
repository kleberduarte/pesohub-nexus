import { Socket } from "net";

/**
 * Escreve um PLU de teste com valores distintivos em campos ainda não mapeados
 * do PLU_FIELD_TEMPLATE (tara, desconto, unidade de venda, modo especial) e
 * tenta lê-lo de volta com verbos candidatos (UPL/PLU, REQ/PLU, DWL/PLU) para
 * ver se a balança ecoa o registro gravado — isso confirma (a) que o write
 * pegou e (b) potencialmente revela um verbo de leitura pra reverse-engineering
 * mais rápido do que capturar tráfego do software oficial.
 *
 * Uso: SCALE_IP=192.168.15.6 npx ts-node --transpile-only src/probe-plu-readback.ts
 */
const ip = process.env.SCALE_IP ?? "192.168.15.6";
const port = Number(process.env.SCALE_PORT ?? 33581);
const TEST_PLU = "500";

function hexdump(buf: Buffer): string {
  const hex = buf.toString("hex").match(/.{1,2}/g)?.join(" ") ?? "";
  const ascii = [...buf].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
  return `HEX: ${hex}\nASCII: ${ascii}`;
}

// Mesmo template capturado em scale-client.ts, com valores-sentinela nos
// campos suspeitos: idx4=2 (unidadeVenda?), idx6="1234,3" (tara 1.234kg?),
// idx7="550,2" (desconto R$5,50?), idx14=3 (modoEspecial?).
const PLU_FIELD_TEMPLATE = [
  "PLU", TEST_PLU, TEST_PLU, "7899998887776", "1", "999,2", "1234,3", "550,2", "0", "0", "0", "0", "0", "0", "9",
  "PROBE TARA DESC", "", "", "", "", "", "", "", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",
  "0", "0", "0,0", "0,0", "0", "127", "0,0", "0,0", "0,0", "0", "127", "0,0", "0,0", "0,0",
  "0", "127", "0,0", "0,0", "0,0", "0", "127", "0,0", "0,0", "0,0", "0", "0", "0", "0", "0",
  "0", "0", "teste", "0", "0", "0", "",
];

async function writeTestPlu(): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    socket.setTimeout(10_000);
    socket.setEncoding("latin1");
    let buffer = "";

    socket.connect(port, ip, () => {
      const body = `DWL\tPLU\t\r\n` + PLU_FIELD_TEMPLATE.join("\t") + "\r\n" + `END\tPLU\t\r\n` + `UPL\tTIM\t\r\n`;
      console.log("Enviando PLU de teste...\n" + body.replace(/\r\n/g, "\\r\\n\n"));
      socket.write(body, "latin1");
    });

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      console.log(">>> resposta ao write:", JSON.stringify(chunk));
      if (buffer.includes("END\tTIM")) {
        socket.write("UPL\tEND\t\r\n", "latin1", () => {
          socket.destroy();
          resolve();
        });
      }
    });

    socket.on("timeout", () => {
      console.log("Timeout no write.");
      socket.destroy();
      resolve();
    });
    socket.on("error", (err) => {
      console.log("Erro no write:", err.message);
      reject(err);
    });
  });
}

async function tryReadVerb(label: string, bytes: Buffer): Promise<void> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(3000);
    let gotData = false;

    socket.connect(port, ip, () => {
      socket.write(bytes, "latin1");
    });

    socket.on("data", (data: Buffer) => {
      gotData = true;
      console.log(`\n>>> [${label}] RESPOSTA (${data.length} bytes):`);
      console.log(hexdump(data));
      const asAscii = data.toString("latin1");
      if (asAscii.includes(TEST_PLU) || asAscii.includes("PROBE")) {
        console.log("*** Contém marcador do PLU de teste — provável echo do registro! ***");
      }
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
  await writeTestPlu();
  await new Promise((r) => setTimeout(r, 500));

  const verbs = ["UPL", "REQ", "DWL", "GET", "RD"];
  const candidates: Array<{ label: string; bytes: Buffer }> = [];
  for (const v of verbs) {
    candidates.push({ label: `${v}/PLU/${TEST_PLU}`, bytes: Buffer.from(`${v}\tPLU\t${TEST_PLU}\t\r\n`, "ascii") });
    candidates.push({ label: `${v}/PLU (sem num)`, bytes: Buffer.from(`${v}\tPLU\t\r\n`, "ascii") });
  }

  console.log(`\nTestando ${candidates.length} verbos de leitura contra ${ip}:${port}...`);
  for (const c of candidates) {
    await tryReadVerb(c.label, c.bytes);
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log("\nFim. Se ALGUM comando ecoou o PLU 500 com 'PROBE01'/'PROBE TARA DESC', copie a saída completa.");
  console.log(`Verifique também FISICAMENTE na balança: acesse o PLU ${TEST_PLU} pelo teclado e confira os campos Tara e Desconto.`);
  process.exit(0);
})();
