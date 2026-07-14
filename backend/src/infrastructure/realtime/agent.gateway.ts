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
import { Server, Socket } from "socket.io";
import Redis from "ioredis";
import { PrismaService } from "../database/prisma.service";

/**
 * Ponte entre o backend e os Agents Locais (processos que rodam dentro da rede
 * da loja, perto das balanças, e falam TCP com o hardware).
 *
 * O Worker de sincronização não conhece Agents diretamente — ele publica comandos
 * no Redis (canal agent:command:<agentId>) e espera a resposta em
 * agent:result:<correlationId>. Este gateway faz a ponte final: Redis <-> socket.io.
 */
@WebSocketGateway({ namespace: "/agents", cors: { origin: "*" } })
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AgentGateway.name);
  private readonly sockets = new Map<string, Socket>();
  private readonly redisSub: Redis;
  private readonly redisPub: Redis;
  private readonly discoveredByAgent = new Map<string, { ip: string; port: number }[]>();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {
    const url = `redis://${process.env.REDIS_HOST ?? "localhost"}:${process.env.REDIS_PORT ?? 6379}`;
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
      socket.emit("sync:command", JSON.parse(message));
    });
  }

  async handleConnection(socket: Socket): Promise<void> {
    const token = (socket.handshake.auth?.token ?? socket.handshake.query?.token) as
      | string
      | undefined;

    if (!token) {
      this.logger.warn(`Conexão de agente rejeitada: token ausente (socket ${socket.id})`);
      socket.disconnect(true);
      return;
    }

    const agent = await this.prisma.agent.findUnique({ where: { token } });
    if (!agent) {
      this.logger.warn(`Conexão de agente rejeitada: token inválido (socket ${socket.id})`);
      socket.disconnect(true);
      return;
    }

    this.sockets.set(agent.id, socket);
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
    await this.prisma.device.updateMany({
      where: { agentId },
      data: { status: "ONLINE", ultimoAcesso: new Date() },
    });
  }

  @SubscribeMessage("sync:result")
  onSyncResult(@MessageBody() body: { correlationId: string; ok: boolean; erro?: string; itensProcessados?: number }): void {
    const { correlationId, ...result } = body;
    this.redisPub.publish(`agent:result:${correlationId}`, JSON.stringify(result));
  }

  @SubscribeMessage("devices:discovered")
  onDevicesDiscovered(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { devices: { ip: string; port: number }[] },
  ): void {
    const agentId = socket.data?.agentId as string | undefined;
    if (!agentId) return;
    this.discoveredByAgent.set(agentId, body.devices ?? []);
  }

  /**
   * Balanças anunciadas via broadcast UDP pelos Agents Locais conectados,
   * deduplicadas por IP (o backend não tem acesso direto à rede da loja).
   */
  getDiscoveredDevices(): { ip: string; port: number }[] {
    const byIp = new Map<string, { ip: string; port: number }>();
    for (const devices of this.discoveredByAgent.values()) {
      for (const device of devices) byIp.set(device.ip, device);
    }
    return [...byIp.values()];
  }
}
