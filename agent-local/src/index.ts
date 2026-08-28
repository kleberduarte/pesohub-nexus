import * as dotenv from "dotenv";
dotenv.config();

import * as dgram from "dgram";
import { io } from "socket.io-client";
import { ScaleSyncPayload, sendProductsToScale } from "./scale-client";

const BACKEND_URL = process.env.AGENT_BACKEND_URL ?? "http://localhost:3000";
const AGENT_TOKEN = process.env.AGENT_TOKEN;
const DISCOVERY_PORT = Number(process.env.SCALE_DISCOVERY_PORT ?? 33584);

if (!AGENT_TOKEN) {
  console.error("AGENT_TOKEN não configurado. Defina a variável de ambiente AGENT_TOKEN antes de iniciar o agente.");
  process.exit(1);
}

/**
 * O backend só deve poder instruir o agente a abrir conexões TCP dentro da
 * rede local da loja (RFC 1918) ou loopback (dev). Isso evita que um backend
 * comprometido ou um MITM use o agente como pivô para varrer/atacar redes
 * externas a partir de dentro da loja.
 */
function isAllowedDeviceIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

interface SyncCommand {
  correlationId: string;
  deviceId: string;
  deviceIp: string;
  devicePort: number;
  tipo: "TOTAL" | "INCREMENTAL";
  products: ScaleSyncPayload[];
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

  if (!isAllowedDeviceIp(command.deviceIp)) {
    console.error(`[sync:command] IP fora da rede local permitida, comando ignorado: ${command.deviceIp}`);
    socket.emit("sync:result", {
      correlationId: command.correlationId,
      ok: false,
      erro: "deviceIp fora do range de rede local permitido",
      itensProcessados: 0,
    });
    return;
  }

  // Conexão nova por escrita (não reaproveitada) — é o caminho verificado
  // fisicamente contra o hardware em 2026-08-28 (tentativa 28), depois do fix
  // do campo idx57 faltando no NU3. `ScaleConnection` (conexão persistente,
  // ScaleConnection.ts) foi removida daqui: era uma hipótese de 2026-08-27
  // testada ANTES do fix real ser encontrado, nunca reverificada com o fix
  // aplicado, e uma sincronização real em produção via esse caminho não
  // persistiu no hardware apesar do ACK — ver [[project_scale_protocol_field_gap]].
  const outcome = await sendProductsToScale(command.deviceIp, command.devicePort, command.products);

  socket.emit("sync:result", {
    correlationId: command.correlationId,
    ok: outcome.ok,
    erro: outcome.erro,
    itensProcessados: outcome.itensProcessados,
  });
});
