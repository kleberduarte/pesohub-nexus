import * as dgram from "dgram";

/**
 * A balança manda um beacon UDP broadcast perguntando por um servidor
 * ("UDP\t33581\t\t\r\n"). Hipótese: o software oficial responde de volta
 * na porta de ORIGEM do beacon (não na 33581), confirmando presença, e só
 * depois a balança inicia a comunicação real. Este script escuta o beacon
 * e testa várias respostas candidatas assim que ele chega.
 *
 * IMPORTANTE: rode isso sozinho (pare o `npm run start:dev` antes), pois
 * dois processos escutando a mesma porta de broadcast no Windows disputam
 * o pacote e só um recebe.
 *
 * Uso: npm run probe:udp:reply
 */
const DISCOVERY_PORT = Number(process.env.SCALE_DISCOVERY_PORT ?? 33584);

function hexdump(buf: Buffer): string {
  const hex = buf.toString("hex").match(/.{1,2}/g)?.join(" ") ?? "";
  const ascii = [...buf].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
  return `HEX: ${hex}\nASCII: ${ascii}`;
}

const replyCandidates: Array<{ label: string; bytes: Buffer }> = [
  { label: "eco do próprio beacon", bytes: Buffer.from("UDP\t33581\t\t\r\n", "ascii") },
  { label: "ACK\\r\\n", bytes: Buffer.from("ACK\r\n", "ascii") },
  { label: "OK\\r\\n", bytes: Buffer.from("OK\r\n", "ascii") },
  { label: "IP local + porta", bytes: Buffer.from("", "ascii") }, // preenchido dinamicamente abaixo
];

const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });

sock.on("message", async (msg, rinfo) => {
  console.log(`\n[beacon recebido] de ${rinfo.address}:${rinfo.port}`);
  console.log(hexdump(msg));

  // Descobre o IP local desta máquina para montar uma resposta plausível
  const localIp = (sock.address() as dgram.AddressInfo).address;
  replyCandidates[3].bytes = Buffer.from(`UDP\t${localIp}\t3000\t\r\n`, "ascii");

  for (const candidate of replyCandidates) {
    console.log(`\nRespondendo com [${candidate.label}] para ${rinfo.address}:${rinfo.port}...`);
    sock.send(candidate.bytes, rinfo.port, rinfo.address);
    await new Promise((r) => setTimeout(r, 1000));
  }
});

sock.on("error", (err) => console.error(`erro: ${err.message}`));
sock.bind(DISCOVERY_PORT, () => {
  console.log(`Escutando beacon em 0.0.0.0:${DISCOVERY_PORT}. Aguardando próximo anúncio da balança (pode levar alguns segundos)...`);
});

setTimeout(() => {
  console.log("\nFechando (60s decorridos).");
  sock.close();
  process.exit(0);
}, 60_000);
