import * as bcrypt from "bcrypt";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService, MAX_TENTATIVAS } from "./auth.service";

/**
 * Card #48 — a empresa/loja ativa deixou de ser coluna do usuário e virou
 * estado de sessão.
 *
 * O comportamento anterior (persistir `activeClienteId`/`activeLojaId` no
 * User) tinha um teste que o travava; ele foi substituído pelos daqui, porque
 * era justamente a causa do bug: com a conta compartilhada da Ramuza, a troca
 * de loja de uma pessoa reaparecia no login da seguinte, que cadastrava
 * produto e sincronizava para a balança da loja errada, sem aviso na tela.
 */
describe("AuthService", () => {
  function makeService(user: any, overrides: { clientePadrao?: any; loja?: any } = {}) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue(user),
      },
      cliente: {
        findUnique: jest.fn().mockResolvedValue({ id: "cliente-ramuza" }),
        findFirst: jest.fn().mockResolvedValue(overrides.clientePadrao ?? null),
      },
      loja: {
        findFirst: jest.fn().mockResolvedValue(overrides.loja ?? null),
      },
      perfilLojaAcesso: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    // O AuthService lê o `exp` de volta via decode para saber por quanto tempo
    // a sessão precisa ficar registrada no Redis.
    const jwt = {
      sign: jest.fn((payload) => JSON.stringify(payload)),
      decode: jest.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 900 })),
    };
    const sessions = {
      registrarSessaoAtiva: jest.fn().mockResolvedValue(undefined),
      revoke: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AuthService(prisma as any, jwt as any, sessions as any);
    return { service, prisma, jwt, sessions };
  }

  function contaBase(extra: any = {}) {
    return {
      id: "u1",
      email: "admin@empresa.com.br",
      role: "ADMIN",
      clienteId: "cliente-toledo",
      perfilId: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      passwordChangedAt: null,
      senhasAnteriores: [],
      ...extra,
    };
  }

  it("login usa o clienteId fixo da conta", async () => {
    const senha = await bcrypt.hash("senha123", 4);
    const { service, jwt } = makeService(contaBase({ senha }));

    await service.login("admin@empresa.com.br", "senha123");

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: "cliente-toledo" }),
      expect.anything(),
    );
  });

  it("SUPERADMIN global entra na empresa padrão, não na última usada por outra sessão", async () => {
    const senha = await bcrypt.hash("senha123", 4);
    const { service, jwt } = makeService(
      contaBase({ id: "u2", email: "super@pesohub.com.br", role: "SUPERADMIN", clienteId: null, senha }),
      { clientePadrao: { id: "cliente-padrao" } },
    );

    await service.login("super@pesohub.com.br", "senha123");

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: "cliente-padrao" }),
      expect.anything(),
    );
  });

  // Trocar de empresa/loja NÃO emite cookie novo: cookie é por navegador, e
  // reemitir arrastaria as outras abas junto — era exatamente esse o bug de
  // "sincronizou para a loja errada".
  it("switchCompany devolve o escopo sem persistir nem reemitir token", async () => {
    const { service, prisma, jwt } = makeService(contaBase({ role: "SUPERADMIN", clienteId: null }));

    const { user } = await service.switchCompany(
      { sub: "u1", email: "super@pesohub.com.br", role: "SUPERADMIN", clienteId: null, lojaId: null },
      "cliente-ramuza",
    );

    expect(user.clienteId).toBe("cliente-ramuza");
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it("switchLoja devolve o escopo sem persistir nem reemitir token", async () => {
    const { service, prisma, jwt } = makeService(contaBase(), { loja: { id: "loja-2", clienteId: "cliente-toledo" } });

    const { user } = await service.switchLoja(
      { sub: "u1", email: "admin@empresa.com.br", role: "ADMIN", clienteId: "cliente-toledo", lojaId: "loja-1" },
      "loja-2",
    );

    expect(user.lojaId).toBe("loja-2");
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it("registra a sessão como única ativa do usuário", async () => {
    const senha = await bcrypt.hash("senha123", 4);
    const { service, sessions } = makeService(contaBase({ senha }));

    const { user } = await service.login("admin@empresa.com.br", "senha123");

    expect(sessions.registrarSessaoAtiva).toHaveBeenCalledWith("u1", user.jti, expect.any(Number));
  });

  it("conta o erro de senha e tranca a conta ao atingir o limite", async () => {
    const senha = await bcrypt.hash("senha123", 4);
    const { service, prisma } = makeService(
      contaBase({ senha, failedLoginAttempts: MAX_TENTATIVAS - 1 }),
    );

    await expect(service.login("admin@empresa.com.br", "senha-errada")).rejects.toThrow(UnauthorizedException);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({ lockedUntil: expect.any(Date), failedLoginAttempts: 0 }),
    });
  });

  it("recusa login de conta trancada mesmo com a senha correta", async () => {
    const senha = await bcrypt.hash("senha123", 4);
    const { service } = makeService(
      contaBase({ senha, lockedUntil: new Date(Date.now() + 10 * 60_000) }),
    );

    await expect(service.login("admin@empresa.com.br", "senha123")).rejects.toThrow(/bloqueada/i);
  });

  it("sinaliza troca de senha obrigatória no primeiro acesso", async () => {
    const senha = await bcrypt.hash("senha123", 4);
    const { service } = makeService(contaBase({ senha, mustChangePassword: true }));

    const { user } = await service.login("admin@empresa.com.br", "senha123");

    expect(user.precisaTrocarSenha).toBe(true);
  });

  it("não revela se o e-mail existe", async () => {
    const { service } = makeService(null);

    await expect(service.login("naoexiste@empresa.com.br", "seja-la-o-que-for")).rejects.toThrow(
      "Credenciais inválidas",
    );
  });
});
