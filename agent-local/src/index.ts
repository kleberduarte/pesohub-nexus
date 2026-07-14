import * as dotenv from "dotenv";
dotenv.config();

import * as dgram from "dgram";
import { io } from "socket.io-client";
import { sendProductsToScale } from "./scale-client";

const BACKEND_URL = process.env.AGENT_BACKEND_URL ?? "http://localhost:3000";
const AGENT_TOKEN = process.env.AGENT_TOKEN ?? "dev-agent-local-token";
const DISCOVERY_PORT = Number(process.env.SCALE_DISCOVERY_PORT ?? 33584);

interface SyncCommand {
  correlationId: string;
  deviceId: string;
  deviceIp: string;
  devicePort: number;
  tipo: "TOTAL" | "INCREMENTAL";
  products: Array<{
    codigo: string;
    codigoBarras: string;
    nome: string;
    preco: number;
    categoriaImposto?: string;
  }>;
}

const socket = io(`${BACKEND_URL}/agents`, {
  auth: { token: AGENT_TOKEN },
  reconnection: true,
  reconnectionDelay: 3000,
});

socket.on("connect", () => {
  console.log(`Agent Local conectado ao backend (${BACKEND_URL}). Socket: ${socket.id}`);
});

socket.on("disconnect", (reason) => {
  console.warn(`Desconectado do backend: ${reason}`);
});

socket.on("connect_error", (err) => {
  console.error(`Falha ao conectar no backend: ${err.message}`);
});

setInterval(() => {
  if (socket.connected) socket.emit("heartbeat");
}, 30_000);

/**
 * A balança anuncia a si mesma via broadcast UDP: envia "UDP\t<porta>\t\t\r\n"
 * periodicamente para a porta de descoberta. Mantemos em memória as balanças
 * vistas nos últimos 60s e reportamos ao backend sempre que a lista muda.
 */
interface DiscoveredScale {
  ip: string;
  port: number;
  lastSeen: number;
}

const discovered = new Map<string, DiscoveredScale>();
const DISCOVERY_TTL_MS = 60_000;

function reportDiscovered() {
  const now = Date.now();
  for (const [ip, scale] of discovered) {
    if (now - scale.lastSeen > DISCOVERY_TTL_MS) discovered.delete(ip);
  }
  if (socket.connected) {
    socket.emit("devices:discovered", {
      devices: [...discovered.values()].map(({ ip, port }) => ({ ip, port })),
    });
  }
}

const discoverySocket = dgram.createSocket({ type: "udp4", reuseAddr: true });
discoverySocket.on("message", (msg, rinfo) => {
  const match = msg.toString("ascii").match(/^UDP\t(\d+)\t/);
  if (!match) return;
  const port = Number(match[1]);
  const isNew = !discovered.has(rinfo.address);
  discovered.set(rinfo.address, { ip: rinfo.address, port, lastSeen: Date.now() });
  if (isNew) console.log(`[discovery] balança encontrada: ${rinfo.address}:${port}`);
  reportDiscovered();
});
discoverySocket.on("error", (err) => console.error(`[discovery] erro: ${err.message}`));
discoverySocket.bind(DISCOVERY_PORT, () => {
  console.log(`[discovery] escutando broadcasts de balança em 0.0.0.0:${DISCOVERY_PORT}`);
});

setInterval(reportDiscovered, 15_000);

socket.on("sync:command", async (command: SyncCommand) => {
  console.log(
    `[sync:command] device=${command.deviceId} ip=${command.deviceIp}:${command.devicePort} ` +
      `tipo=${command.tipo} produtos=${command.products.length}`,
  );

  const outcome = await sendProductsToScale(command.deviceIp, command.devicePort, command.products);

  socket.emit("sync:result", {
    correlationId: command.correlationId,
    ok: outcome.ok,
    erro: outcome.erro,
    itensProcessados: outcome.itensProcessados,
  });
});
