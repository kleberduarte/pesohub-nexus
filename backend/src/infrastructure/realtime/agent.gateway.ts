import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Server, Socket } from "socket.io";
import Redis from "ioredis";
import { PrismaService } from "../database/prisma.service";
import { getRedisUrl } from "../queue/redis-connection";
import { hashAgentToken } from "../../domain/services/agent-token";

/**
 * Ponte entre o backend e os Agents Locais (processos que rodam dentro da rede
 * da loja, perto das balanças, e falam TCP com o hardware).
 *
 * O Worker de sincronização não conhece Agents diretamente — ele publica comandos
 * no Redis (canal agent:command:<agentId>) e espera a resposta em
 * agent:result:<correlationId>. Este gateway faz a ponte final: Redis <-> socket.io.
 */
export interface SlotEtiquetaSalvo {
  numero: number;
  nome: string;
}

/**
 * Une o mapa de slots conhecido com o que a balança acabou de reportar.
 *
 * Aditivo de propósito (card #59). O `UPL/LAB` da balança é incompleto e varia
 * entre chamadas — o mesmo equipamento devolveu 65, 64, 54 e 52 registros em
 * leituras seguidas, e duas delas ainda sinalizaram fim com `END	LAB`.
 * Substituir o mapa faria um slot ocupado sumir por truncamento, e o cadastro
 * passaria a oferecê-lo como livre: exatamente o erro que o card #55 existe
 * para evitar.
 *
 * Os dois erros possíveis não são simétricos. Errar para "ocupado" custa ao
 * usuário escolher outro número; errar para "livre" o manda gravar num slot de
 * fábrica, que a balança descarta em silêncio.
 *
 * O que chega agora vence no NOME — um slot regravado tem nome novo. Só a
 * AUSÊNCIA é que não conta como informação.
 */
export function unirSlotsEtiqueta(
  anteriores: unknown,
  recebidos: SlotEtiquetaSalvo[],
): SlotEtiquetaSalvo[] {
  const porNumero = new Map<number, SlotEtiquetaSalvo>();
  const previos = Array.isArray(anteriores) ? (anteriores as { numero?: unknown; nome?: unknown }[]) : [];
  for (const slot of previos) {
    if (!Number.isInteger(slot?.numero)) continue;
    porNumero.set(slot.numero as number, { numero: slot.numero as number, nome: String(slot.nome ?? "") });
  }
  for (const slot of recebidos) porNumero.set(slot.numero, slot);
  return [...porNumero.values()].sort((a, b) => a.numero - b.numero);
}

@WebSocketGateway({
  namespace: "/agents",
  cors: { origin: (process.env.CORS_ORIGIN ?? "http://localhost:3001").split(",").map((o) => o.trim()) },
})
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AgentGateway.name);
  private readonly sockets = new Map<string, Socket>();
  private readonly redisSub: Redis;
  private readonly redisPub: Redis;
  private readonly discoveredByAgent = new Map<string, { ip: string; port: number }[]>();
  // clienteId de cada agent conectado — necessário pra não misturar balanças
  // descobertas de agents de clientes diferentes em getDiscoveredDevices().
  private readonly clienteIdByAgent = new Map<string, string>();
  // correlationId -> agentId pra quem o comando foi despachado. Sem isso,
  // qualquer agent autenticado pode publicar o resultado de um comando
  // destinado a outro agent (de outro cliente), forjando "sync concluído".
  private readonly agentByCorrelation = new Map<string, string>();
  // Último instante em que marcamos os devices de cada agent como ONLINE.
  // O heartbeat chega a cada poucos segundos por agent; sem esse teto, cada
  // um dispara um UPDATE em toda a tabela de devices daquele agent — com
  // milhares de agents isso vira o gargalo de escrita do banco.
  private readonly lastDeviceTouch = new Map<string, number>();
  private static readonly DEVICE_TOUCH_INTERVAL_MS = 60_000;

  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {
    const url = getRedisUrl();
    this.redisSub = new Redis(url);
    this.redisPub = new Redis(url);

    this.redisSub.psubscribe("agent:command:*");
    this.redisSub.on("pmessage", (_pattern, channel, message) => {
      const agentId = channel.split(":")[2];
      const socket = this.sockets.get(agentId);
      if (!socket) {
        const { correlationId } = JSON.parse(message);
        this.redisPub.publish(
          `agent:result:${correlationId}`,
          JSON.stringify({ ok: false, erro: "Agent Local não está conectado no momento." }),
        );
        return;
      }
      const command = JSON.parse(message);
      if (command.correlationId) {
        this.agentByCorrelation.set(command.correlationId, agentId);
      }
      socket.emit("sync:command", command);
    });
  }

  async handleConnection(socket: Socket): Promise<void> {
    // Só `auth.token`: um token em query string acaba gravado em log de proxy,
    // histórico e referer. O agent-local sempre enviou por `auth` (ver
    // agent-local/src/index.ts), então não há agente em campo a quebrar.
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      this.logger.warn(`Conexão de agente rejeitada: token ausente (socket ${socket.id})`);
      socket.disconnect(true);
      return;
    }

    const agent = await this.prisma.agent.findUnique({ where: { tokenHash: hashAgentToken(token) } });
    if (!agent) {
      this.logger.warn(`Conexão de agente rejeitada: token inválido (socket ${socket.id})`);
      socket.disconnect(true);
      return;
    }

    this.sockets.set(agent.id, socket);
    this.clienteIdByAgent.set(agent.id, agent.clienteId);
    socket.data.agentId = agent.id;
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { ultimoHeartbeat: new Date() },
    });
    await this.prisma.device.updateMany({
      where: { agentId: agent.id },
      data: { status: "ONLINE", ultimoAcesso: new Date() },
    });

    this.logger.log(`Agent Local conectado: ${agent.id} (loja ${agent.lojaId})`);
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const agentId = socket.data?.agentId as string | undefined;
    if (agentId) {
      this.sockets.delete(agentId);
      this.clienteIdByAgent.delete(agentId);
      this.discoveredByAgent.delete(agentId);
      this.lastDeviceTouch.delete(agentId);
      await this.prisma.device.updateMany({
        where: { agentId },
        data: { status: "OFFLINE" },
      });
      this.logger.log(`Agent Local desconectado: ${agentId}`);
    }
  }

  @SubscribeMessage("heartbeat")
  async onHeartbeat(@ConnectedSocket() socket: Socket): Promise<void> {
    const agentId = socket.data?.agentId as string | undefined;
    if (!agentId) return;
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { ultimoHeartbeat: new Date() },
    });

    const now = Date.now();
    const last = this.lastDeviceTouch.get(agentId) ?? 0;
    if (now - last < AgentGateway.DEVICE_TOUCH_INTERVAL_MS) return;
    this.lastDeviceTouch.set(agentId, now);
    await this.prisma.device.updateMany({
      where: { agentId },
      data: { status: "ONLINE", ultimoAcesso: new Date() },
    });
  }

  @SubscribeMessage("sync:result")
  onSyncResult(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { correlationId: string; ok: boolean; erro?: string; itensProcessados?: number },
  ): void {
    const agentId = socket.data?.agentId as string | undefined;
    const { correlationId, ...result } = body;
    if (!agentId || this.agentByCorrelation.get(correlationId) !== agentId) {
      this.logger.warn(`Resultado de sync descartado: agent ${agentId} não é o destinatário de ${correlationId}`);
      return;
    }
    this.agentByCorrelation.delete(correlationId);
    this.redisPub.publish(`agent:result:${correlationId}`, JSON.stringify(result));
  }

  @SubscribeMessage("devices:discovered")
  async onDevicesDiscovered(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { devices: { ip: string; port: number }[] },
  ): Promise<void> {
    const agentId = socket.data?.agentId as string | undefined;
    if (!agentId) return;
    const devices = body.devices ?? [];
    this.discoveredByAgent.set(agentId, devices);
    await this.reconcileDriftedIp(agentId, devices);
  }

  /**
   * Mapa de slots de etiqueta lidos da balança pelo Agent Local (card #55).
   *
   * Persiste no Device em vez de ficar em memória: o cadastro de Formato de
   * Impressão consulta isso, e um backend recém-reiniciado não pode voltar
   * dizendo que todo slot está livre — seria pior que não ter o recurso.
   *
   * O agente só emite quando a leitura deu certo; leitura falha não chega
   * aqui. Assim o mapa envelhece em vez de zerar, e `slotsEtiquetaLidosEm`
   * deixa a idade visível pra tela.
   */
  @SubscribeMessage("devices:slots")
  async onDevicesSlots(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { ip: string; port: number; slots: { numero: number; nome: string }[] },
  ): Promise<void> {
    const agentId = socket.data?.agentId as string | undefined;
    if (!agentId || !body?.ip || !Array.isArray(body.slots)) return;

    // Escopado pelo agentId: um agent só descreve as balanças que são dele,
    // nunca as de outro cliente conectado ao mesmo backend.
    const device = await this.prisma.device.findFirst({
      where: { agentId, ip: body.ip },
    });
    if (!device) return;

    const recebidos = body.slots
      .filter((s) => Number.isInteger(s?.numero))
      .map((s) => ({ numero: s.numero, nome: String(s.nome ?? "") }));

    const slots = unirSlotsEtiqueta(device.slotsEtiqueta, recebidos);

    try {
      await this.prisma.device.update({
        where: { id: device.id },
        data: { slotsEtiqueta: slots as unknown as Prisma.InputJsonValue, slotsEtiquetaLidosEm: new Date() },
      });
    } catch (err) {
      this.logger.warn(
        `Falha ao salvar slots de etiqueta do device ${device.id}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * O IP da balança é DHCP e pode mudar a qualquer momento — quando isso
   * acontece, o `Device.ip` cadastrado fica desatualizado e todo sync passa a
   * falhar com timeout até alguém perceber e corrigir manualmente. Quando o
   * agent só tem UMA balança vinculada e o broadcast de descoberta reporta
   * exatamente uma balança na mesma porta com um IP diferente do cadastrado,
   * é seguro assumir que é a mesma balança e atualizar sozinho. Ambíguo
   * (múltiplas balanças no mesmo agent, ou múltiplas descobertas na mesma
   * porta) não mexe em nada — fica pro fluxo manual de sempre.
   */
  private async reconcileDriftedIp(
    agentId: string,
    devices: { ip: string; port: number }[],
  ): Promise<void> {
    const registered = await this.prisma.device.findMany({ where: { agentId } });
    if (registered.length !== 1) return;

    const [device] = registered;
    const candidates = devices.filter((d) => d.port === device.porta && d.ip !== device.ip);
    if (candidates.length !== 1) return;

    const [candidate] = candidates;
    try {
      await this.prisma.device.update({
        where: { id: device.id },
        data: { ip: candidate.ip },
      });
      this.logger.log(
        `IP da balança "${device.nome}" (agent ${agentId}) atualizado automaticamente: ${device.ip} -> ${candidate.ip}`,
      );
    } catch (err) {
      // Provavelmente colidiu com o @@unique([lojaId, ip]) de outro device já
      // cadastrado nesse IP — não é fatal, só deixa pro fluxo manual.
      this.logger.warn(`Falha ao auto-corrigir IP do device ${device.id}: ${(err as Error).message}`);
    }
  }

  /**
   * Balanças anunciadas via broadcast UDP pelos Agents Locais conectados,
   * deduplicadas por IP. Escopado por clienteId — cada tenant só pode ver
   * as balanças descobertas pelos seus próprios Agents (nunca de outro
   * cliente conectado ao mesmo backend).
   */
  getDiscoveredDevices(clienteId: string): { ip: string; port: number }[] {
    const byIp = new Map<string, { ip: string; port: number }>();
    for (const [agentId, devices] of this.discoveredByAgent) {
      if (this.clienteIdByAgent.get(agentId) !== clienteId) continue;
      for (const device of devices) byIp.set(device.ip, device);
    }
    return [...byIp.values()];
  }
}
