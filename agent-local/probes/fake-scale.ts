import * as dgram from "dgram";
import { createServer } from "net";

const DISCOVERY_PORT = Number(process.env.SCALE_DISCOVERY_PORT ?? 33584);
const TCP_PORT = Number(process.env.FAKE_SCALE_TCP_PORT ?? 33581);
const BROADCAST_ADDR = process.env.FAKE_SCALE_BROADCAST ?? "127.0.0.1";

const beacon = dgram.createSocket({ type: "udp4", reuseAddr: true });
beacon.bind(() => {
  beacon.setBroadcast(true);
  setInterval(() => {
    const msg = Buffer.from(`UDP\t${TCP_PORT}\t\t\r\n`, "ascii");
    beacon.send(msg, DISCOVERY_PORT, BROADCAST_ADDR);
    console.log(`[fake-scale] beacon enviado para ${BROADCAST_ADDR}:${DISCOVERY_PORT}`);
  }, 3000);
});

const server = createServer((socket) => {
  console.log(`[fake-scale] conexao TCP recebida de ${socket.remoteAddress}:${socket.remotePort}`);
  let buffer = "";
  let pluLogged = false;
  let timAnswered = false;
  socket.setEncoding("latin1");
  socket.on("data", (chunk: string) => {
    buffer += chunk;

    if (!pluLogged && buffer.includes("END\tPLU")) {
      pluLogged = true;
      const pluLines = buffer.split("\r\n").filter((l) => l && !l.startsWith("DWL") && !l.startsWith("END") && !l.startsWith("UPL"));
      console.log(`[fake-scale] recebido bloco DWL/PLU com ${pluLines.length} produto(s):`);
      for (const line of pluLines) {
        const fields = line.split("\t");
        console.log(`  PLU=${fields[1]} codigo=${fields[2]} preco=${fields[5]} nome=${fields[15]}`);
      }
    }
    if (!timAnswered && buffer.includes("UPL\tTIM")) {
      timAnswered = true;
      socket.write("END\tTIM\t\r\n", "latin1");
    }
    if (buffer.includes("UPL\tEND")) {
      console.log("[fake-scale] sessao encerrada pelo agente. Confirmando.");
      socket.end();
    }
  });
  socket.on("error", (err) => console.error(`[fake-scale] erro TCP: ${err.message}`));
});

server.listen(TCP_PORT, () => {
  console.log(`[fake-scale] escutando TCP em 0.0.0.0:${TCP_PORT}, beacon UDP a cada 3s`);
});
