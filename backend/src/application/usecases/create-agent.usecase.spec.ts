import { CreateAgentUseCase } from "./create-agent.usecase";

describe("CreateAgentUseCase", () => {
  it("gera um token e cria o agent escopado ao cliente/loja", async () => {
    const prisma = { agent: { create: jest.fn((args) => Promise.resolve({ id: "agent-1", ...args.data })) } };
    const usecase = new CreateAgentUseCase(prisma as any);

    const agent = await usecase.execute("cliente-a", "loja-05");

    expect(agent.clienteId).toBe("cliente-a");
    expect(agent.lojaId).toBe("loja-05");
    expect(typeof agent.token).toBe("string");
    expect(agent.token.length).toBeGreaterThan(20);
  });

  it("gera tokens diferentes a cada chamada", async () => {
    const prisma = { agent: { create: jest.fn((args) => Promise.resolve({ id: "agent-x", ...args.data })) } };
    const usecase = new CreateAgentUseCase(prisma as any);

    const a = await usecase.execute("cliente-a", "loja-01");
    const b = await usecase.execute("cliente-a", "loja-02");

    expect(a.token).not.toEqual(b.token);
  });
});
