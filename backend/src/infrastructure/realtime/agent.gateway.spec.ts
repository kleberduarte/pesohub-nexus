jest.mock("ioredis", () =>
  jest.fn().mockImplementation(() => ({ psubscribe: jest.fn(), on: jest.fn(), publish: jest.fn() })),
);

import { Socket } from "socket.io";
import { AgentGateway } from "./agent.gateway";
import { PrismaService } from "../database/prisma.service";

function criarGateway() {
  const prisma = {
    agent: {
      findUnique: jest.fn().mockResolvedValue({ id: "agent-1", clienteId: "cliente-1", lojaId: "loja-1" }),
      update: jest.fn().mockResolvedValue({}),
    },
    device: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
  const gateway = new AgentGateway(prisma as unknown as PrismaService);
  return { gateway, prisma };
}

function criarSocket(id: string): Socket {
  return { id, data: {}, handshake: { auth: { token: "tok" } }, disconnect: jest.fn() } as unknown as Socket;
}

function statusGravados(prisma: ReturnType<typeof criarGateway>["prisma"]): string[] {
  return prisma.device.updateMany.mock.calls.map(([args]) => args.data.status);
}

// Card #82: a conexão antiga caindo depois que a nova já entrou apagava o
// socket válido e marcava as balanças OFFLINE com o agente conectado.
describe("AgentGateway — reconexão fora de ordem", () => {
  it("queda da conexão antiga não desfaz a nova", async () => {
    const { gateway, prisma } = criarGateway();
    const antiga = criarSocket("antiga");
    const nova = criarSocket("nova");

    await gateway.handleConnection(antiga);
    await gateway.handleConnection(nova);
    await gateway.handleDisconnect(antiga);

    expect(statusGravados(prisma)).toEqual(["ONLINE", "ONLINE"]);
    expect((gateway as unknown as { sockets: Map<string, Socket> }).sockets.get("agent-1")).toBe(nova);
  });

  it("não derruba a conexão antiga (o cliente não reconectaria sozinho)", async () => {
    const { gateway } = criarGateway();
    const antiga = criarSocket("antiga");

    await gateway.handleConnection(antiga);
    await gateway.handleConnection(criarSocket("nova"));

    expect(antiga.disconnect).not.toHaveBeenCalled();
  });

  it("queda da conexão atual continua marcando OFFLINE", async () => {
    const { gateway, prisma } = criarGateway();
    const unica = criarSocket("unica");

    await gateway.handleConnection(unica);
    await gateway.handleDisconnect(unica);

    expect(statusGravados(prisma)).toEqual(["ONLINE", "OFFLINE"]);
    expect((gateway as unknown as { sockets: Map<string, Socket> }).sockets.has("agent-1")).toBe(false);
  });

  it("socket rejeitado (sem agentId) não mexe em nada ao cair", async () => {
    const { gateway, prisma } = criarGateway();
    await gateway.handleDisconnect(criarSocket("anonimo"));
    expect(prisma.device.updateMany).not.toHaveBeenCalled();
  });
});
