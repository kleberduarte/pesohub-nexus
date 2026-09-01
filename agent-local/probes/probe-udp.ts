import * as dgram from "dgram";

/**
 * Descobrimos via Wireshark que a balança anuncia a si mesma via broadcast
 * UDP ("UDP\t33581\t\t\r\n" de 10.10.40.35:33583 para 255.255.255.255:33584),
 * ou seja, o protocolo TXT-MODE roda sobre UDP na porta 33581, não TCP.
 * Este script escuta o broadcast e também tenta comandos UDP diretos.
 *
 * Uso: SCALE_IP=10.10.40.35 SCALE_PORT=33581 npm run probe:udp
 */
const ip = process.env.SCALE_IP ?? "10.10.40.35";
const port = Number(process.env.SCALE_PORT ?? 33581);
const broadcastPort = Number(process.env.BROADCAST_PORT ?? 33584);

function hexdump(buf: Buffer): string {
  const hex = buf.toString("hex").match(/.{1,2}/g)?.join(" ") ?? "";
  const ascii = [...buf].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
  return `HEX: ${hex}\nASCII: ${ascii}`;
}

// 1) Escuta o broadcast de descoberta da balança (confirma que ela está viva na rede)
const listener = dgram.createSocket({ type: "udp4", reuseAddr: true });
listener.on("message", (msg, rinfo) => {
  console.log(`\n[broadcast] recebido de ${rinfo.address}:${rinfo.port}`);
  console.log(hexdump(msg));
});
listener.on("error", (err) => console.error(`[broadcast] erro: ${err.message}`));
listener.bind(broadcastPort, () => {
  console.log(`Escutando broadcast em 0.0.0.0:${broadcastPort} por 15s...`);
});

// 2) Envia comandos candidatos diretamente na porta 33581 via UDP
const candidates: Array<{ label: string; bytes: Buffer }> = [
  { label: "ENQ (0x05)", bytes: Buffer.from([0x05]) },
  { label: "STATUS\\r\\n", bytes: Buffer.from("STATUS\r\n", "ascii") },
  { label: "P\\r\\n", bytes: Buffer.from("P\r\n", "ascii") },
  { label: "STX 'P' ETX", bytes: Buffer.from([0x02, 0x50, 0x03]) },
  { label: "UDP\\t33581\\t\\t\\r\\n (eco do beacon)", bytes: Buffer.from("UDP\t33581\t\t\r\n", "ascii") },
];

const sender = dgram.createSocket("udp4");
sender.on("message", (msg, rinfo) => {
  console.log(`\n[resposta direta] de ${rinfo.address}:${rinfo.port}`);
  console.log(hexdump(msg));
});
sender.on("error", (err) => console.error(`[sender] erro: ${err.message}`));

async function sendCandidates() {
  for (const c of candidates) {
    console.log(`\nEnviando [${c.label}] para ${ip}:${port}...`);
    sender.send(c.bytes, port, ip);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

sendCandidates();

setTimeout(() => {
  console.log("\nFechando (15s decorridos).");
  listener.close();
  sender.close();
  process.exit(0);
}, 15_000);
