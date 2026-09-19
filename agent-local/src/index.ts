import * as dotenv from "dotenv";
dotenv.config();

import * as dgram from "dgram";
import { io } from "socket.io-client";
import {
  FormatoImpressaoPayload,
  listarSlotsEtiqueta,
  ScaleSyncPayload,
  sendProductsToScale,
} from "./scale-client";
import { lerTabelaArp, resolverMac, varrerSubRede } from "./mac-resolver";

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
  /** Formatos de etiqueta a gravar mesmo que nenhum produto do lote os use. */
  formatosImpressao?: FormatoImpressaoPayload[];
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
  /** MAC lido do ARP — é o que deixa o backend reconhecer a balança quando o
   * DHCP troca o IP (card #79). null enquanto não resolvido ou incerto. */
  mac: string | null;
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
      devices: [...discovered.values()].map(({ ip, port, mac }) => ({ ip, port, mac })),
    });
  }
}

const discoverySocket = dgram.createSocket({ type: "udp4", reuseAddr: true });
discoverySocket.on("message", (msg, rinfo) => {
  const match = msg.toString("ascii").match(/^UDP\t(\d+)\t/);
  if (!match) return;
  const port = Number(match[1]);
  const anterior = discovered.get(rinfo.address);
  discovered.set(rinfo.address, { ip: rinfo.address, port, mac: anterior?.mac ?? null, lastSeen: Date.now() });
  if (!anterior) {
    console.log(`[discovery] balança encontrada: ${rinfo.address}:${port}`);
    void identificar(rinfo.address);
  }
  reportDiscovered();
});

/** Resolve o MAC de um IP recém-visto e reporta de novo quando descobrir. */
async function identificar(ip: string) {
  const mac = await resolverMac(ip);
  const scale = discovered.get(ip);
  if (!scale) return;
  scale.mac = mac;
  if (mac) {
    console.log(`[discovery] ${ip} identificada pelo MAC ${mac}`);
  } else {
    console.warn(`[discovery] não foi possível ler o MAC de ${ip}; o IP dela não será atualizado automaticamente`);
  }
  reportDiscovered();
}
discoverySocket.on("error", (err) => console.error(`[discovery] erro: ${err.message}`));
discoverySocket.bind(DISCOVERY_PORT, () => {
  console.log(`[discovery] escutando broadcasts de balança em 0.0.0.0:${DISCOVERY_PORT}`);
});

setInterval(reportDiscovered, 15_000);

/**
 * Localização pelo MAC, sem depender do anúncio UDP.
 *
 * O anúncio é descartado em silêncio pelo firewall do Windows quando o agente
 * roda como serviço sem a regra de entrada — e aí o agente não reporta nada,
 * e a correção de IP do backend (card #79) nunca começa. Foi o que deixou uma
 * balança da loja cadastrada no IP antigo em 2026-09-19.
 *
 * O backend informa os MACs das balanças deste agente; procuramos cada um na
 * tabela ARP e o reportamos como descoberto. Não abre sessão TCP: a balança
 * atende uma por vez e não queremos disputar com a sincronização. Quando um MAC
 * não está na tabela, pingamos a sub-rede (no máximo a cada VARREDURA_MS) para
 * o SO preenchê-la.
 */
const LOCALIZACAO_MS = 45_000;
const VARREDURA_MS = 5 * 60_000;
let ultimaVarredura = 0;
let localizando = false;
let avisouSemBalanca = false;

async function localizarPorMac() {
  if (!socket.connected || localizando) return;
  localizando = true;
  try {
    const resposta = (await socket.timeout(10_000).emitWithAck("devices:known")) as {
      devices?: { mac: string; port: number }[];
    };
    const conhecidas = resposta?.devices ?? [];
    if (conhecidas.length === 0) return;

    let tabela = await lerTabelaArp();
    const faltando = conhecidas.some((d) => !tabela.has(d.mac));
    if (faltando && Date.now() - ultimaVarredura > VARREDURA_MS) {
      ultimaVarredura = Date.now();
      await varrerSubRede();
      tabela = await lerTabelaArp();
    }

    let achadas = 0;
    for (const { mac, port } of conhecidas) {
      const ip = tabela.get(mac);
      if (!ip) continue;
      achadas++;
      const anterior = discovered.get(ip);
      if (!anterior) console.log(`[discovery] balança ${mac} localizada pelo MAC em ${ip}:${port}`);
      discovered.set(ip, { ip, port: anterior?.port ?? port, mac, lastSeen: Date.now() });
    }

    if (achadas === 0 && !avisouSemBalanca) {
      console.warn(
        `[discovery] nenhuma das ${conhecidas.length} balança(s) cadastrada(s) foi encontrada na rede ` +
          `(nem por anúncio UDP, nem pelo MAC). Confira se estão ligadas e na mesma rede deste computador.`,
      );
    }
    avisouSemBalanca = achadas === 0;
    if (achadas > 0) reportDiscovered();
  } catch (err) {
    console.warn(`[discovery] falha ao localizar balanças pelo MAC: ${(err as Error).message}`);
  } finally {
    localizando = false;
  }
}

socket.on("connect", () => {
  void localizarPorMac();
});
setInterval(() => {
  void localizarPorMac();
}, LOCALIZACAO_MS);

/**
 * Relatório do mapa de slots de etiqueta (card #55).
 *
 * O cadastro de Formato de Impressão pede um número de 1 a 99 sem dizer quais
 * já estão tomados. Cair num slot ocupado por modelo de fábrica faz a balança
 * aceitar e descartar em silêncio — foi o que tirou a tabela nutricional de uma
 * etiqueta em produção. Quem sabe a verdade é o equipamento, e só o agente
 * alcança o equipamento.
 *
 * Intervalo generoso de propósito: a balança atende UM cliente por vez, então
 * consultar de minuto em minuto disputaria sessão com a sincronização e com o
 * software da Ramuza aberto na loja.
 */
const SLOTS_REPORT_INTERVAL_MS = 10 * 60_000;

/** Balanças ocupadas por uma sincronização em andamento — não consultar. */
const sincronizando = new Set<string>();

async function reportSlots() {
  if (!socket.connected) return;

  for (const { ip, port } of discovered.values()) {
    if (sincronizando.has(ip)) continue;

    const r = await listarSlotsEtiqueta(ip, port);
    if (!r.ok) {
      // Não emitimos nada: sem relatório o backend mantém o último mapa lido,
      // que é honesto ("está velho"). Emitir lista vazia seria pior — o
      // cadastro passaria a liberar todo slot como se estivesse livre.
      console.warn(`[slots] não foi possível ler ${ip}:${port} — ${r.erro}`);
      continue;
    }
    socket.emit("devices:slots", { ip, port, slots: r.slots });
  }
}

setInterval(() => {
  void reportSlots();
}, SLOTS_REPORT_INTERVAL_MS);

socket.on("sync:command", async (command: SyncCommand) => {
  console.log(
    `[sync:command] device=${command.deviceId} ip=${command.deviceIp}:${command.devicePort} ` +
      `tipo=${command.tipo} produtos=${command.products.length} formatos=${command.formatosImpressao?.length ?? 0}`,
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
  sincronizando.add(command.deviceIp);
  let outcome;
  try {
    outcome = await sendProductsToScale(
      command.deviceIp,
      command.devicePort,
      command.products,
      command.formatosImpressao ?? [],
    );
  } finally {
    sincronizando.delete(command.deviceIp);
  }

  socket.emit("sync:result", {
    correlationId: command.correlationId,
    ok: outcome.ok,
    erro: outcome.erro,
    itensProcessados: outcome.itensProcessados,
  });

  // A sincronização acabou de mudar os slots — é o melhor momento pra
  // atualizar o mapa, e a sessão já está livre.
  const slots = await listarSlotsEtiqueta(command.deviceIp, command.devicePort);
  if (slots.ok) {
    socket.emit("devices:slots", {
      ip: command.deviceIp,
      port: command.devicePort,
      slots: slots.slots,
    });
  }
});
