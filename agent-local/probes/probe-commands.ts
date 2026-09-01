import { Socket } from "net";

/**
 * Testa uma lista de comandos "candidatos" comuns em protocolos de balança
 * (ENQ, STATUS ASCII, framing STX/ETX) contra a balança real, mostrando
 * a resposta (se houver) em hexdump para cada um. Usado quando não temos
 * a especificação de baixo nível do protocolo TXT-MODE (JHScale).
 *
 * Uso: SCALE_IP=10.10.40.35 SCALE_PORT=33581 npm run probe:commands
 */
const ip = process.env.SCALE_IP ?? "10.10.40.35";
const port = Number(process.env.SCALE_PORT ?? 33581);

function hexdump(buf: Buffer): string {
  const hex = buf.toString("hex").match(/.{1,2}/g)?.join(" ") ?? "";
  const ascii = [...buf].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
  return `HEX: ${hex}\nASCII: ${ascii}`;
}

const candidates: Array<{ label: string; bytes: Buffer }> = [
  { label: "ENQ (0x05)", bytes: Buffer.from([0x05]) },
  { label: "STATUS\\r\\n", bytes: Buffer.from("STATUS\r\n", "ascii") },
  { label: "P\\r\\n", bytes: Buffer.from("P\r\n", "ascii") },
  { label: "ID\\r\\n", bytes: Buffer.from("ID\r\n", "ascii") },
  { label: "VERSION\\r\\n", bytes: Buffer.from("VERSION\r\n", "ascii") },
  { label: "STX 'P' ETX (0x02 0x50 0x03)", bytes: Buffer.from([0x02, 0x50, 0x03]) },
  { label: "STX ETX vazio (0x02 0x03)", bytes: Buffer.from([0x02, 0x03]) },
  { label: "DLE (0x10)", bytes: Buffer.from([0x10]) },
  { label: "CR LF vazio", bytes: Buffer.from("\r\n", "ascii") },
  { label: "0x01 (SOH)", bytes: Buffer.from([0x01]) },
];

async function tryCandidate(label: string, bytes: Buffer): Promise<void> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(4000);
    let gotData = false;

    socket.connect(port, ip, () => {
      socket.write(bytes);
    });

    socket.on("data", (data: Buffer) => {
      gotData = true;
      console.log(`\n>>> [${label}] RESPOSTA (${data.length} bytes):`);
      console.log(hexdump(data));
    });

    socket.on("timeout", () => {
      if (!gotData) console.log(`\n>>> [${label}] sem resposta (timeout).`);
      socket.destroy();
      resolve();
    });

    socket.on("error", (err) => {
      console.log(`\n>>> [${label}] erro: ${err.message}`);
      resolve();
    });

    socket.on("close", () => resolve());
  });
}

(async () => {
  console.log(`Testando comandos candidatos contra ${ip}:${port}...\n`);
  for (const c of candidates) {
    await tryCandidate(c.label, c.bytes);
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log("\nFim dos testes.");
  process.exit(0);
})();
