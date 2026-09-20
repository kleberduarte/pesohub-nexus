import { ForbiddenException } from "@nestjs/common";
import { HEADER_CLIENTE, HEADER_LOJA, SessionScopeService } from "./session-scope.service";

/**
 * O escopo da aba chega num cabeçalho, ou seja, é entrada controlada pelo
 * navegador. Estes testes travam a regra central: o cabeçalho só ESCOLHE entre
 * o que a conta já pode ver — nunca amplia permissão.
 */
describe("SessionScopeService", () => {
  function makeService(over: any = {}) {
    const prisma = {
      cliente: { findUnique: jest.fn().mockResolvedValue(null) },
      loja: { findFirst: jest.fn().mockResolvedValue(null) },
      user: { findUnique: jest.fn().mockResolvedValue({ perfilId: null }) },
      perfilLojaAcesso: { findFirst: jest.fn().mockResolvedValue(null) },
      ...over,
    };
    return { service: new SessionScopeService(prisma as any), prisma };
  }

  const admin = {
    sub: "u1",
    role: "ADMIN",
    clienteId: "cliente-a",
    lojaId: "loja-1",
    perfilId: null,
    scoped: false,
  };

  it("sem cabeçalho, mantém o escopo do token", async () => {
    const { service } = makeService();
    await expect(service.resolver(admin, {})).resolves.toEqual({
      clienteId: "cliente-a",
      lojaId: "loja-1",
    });
  });

  it("aceita uma loja da própria empresa", async () => {
    const { service } = makeService({
      loja: { findFirst: jest.fn().mockResolvedValue({ id: "loja-2", clienteId: "cliente-a" }) },
    });

    await expect(service.resolver(admin, { [HEADER_LOJA]: "loja-2" })).resolves.toEqual({
      clienteId: "cliente-a",
      lojaId: "loja-2",
    });
  });

  // O ataque óbvio: mandar no cabeçalho o id de uma loja de OUTRA empresa.
  // Desde o card #83 isso NEGA a requisição em vez de seguir com o escopo
  // antigo: responder dados da loja A a quem pediu a loja B é pior que um erro.
  it("recusa loja que não pertence à empresa do usuário", async () => {
    const { service } = makeService({
      // findFirst filtra por clienteId, então a loja de outra empresa não é achada.
      loja: { findFirst: jest.fn().mockResolvedValue(null) },
    });

    await expect(
      service.resolver(admin, { [HEADER_LOJA]: "loja-de-outra-empresa" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("recusa loja fora do Perfil de um OPERADOR", async () => {
    const operador = { ...admin, role: "OPERADOR" };
    const { service } = makeService({
      loja: { findFirst: jest.fn().mockResolvedValue({ id: "loja-9", clienteId: "cliente-a" }) },
      user: { findUnique: jest.fn().mockResolvedValue({ perfilId: "perfil-1" }) },
      perfilLojaAcesso: { findFirst: jest.fn().mockResolvedValue(null) },
    });

    await expect(service.resolver(operador, { [HEADER_LOJA]: "loja-9" })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  // O coração do card #83: ADMIN deixou de ser passe livre.
  it("recusa loja fora do Perfil de um ADMIN de loja", async () => {
    const { service } = makeService({
      loja: { findFirst: jest.fn().mockResolvedValue({ id: "loja-9", clienteId: "cliente-a" }) },
      user: { findUnique: jest.fn().mockResolvedValue({ role: "ADMIN", perfilId: "perfil-da-loja-1" }) },
      perfilLojaAcesso: { findFirst: jest.fn().mockResolvedValue(null) },
    });

    await expect(service.resolver(admin, { [HEADER_LOJA]: "loja-9" })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("ADMIN com Perfil segue entrando nas lojas do próprio Perfil", async () => {
    const { service } = makeService({
      loja: { findFirst: jest.fn().mockResolvedValue({ id: "loja-2", clienteId: "cliente-a" }) },
      user: { findUnique: jest.fn().mockResolvedValue({ role: "ADMIN", perfilId: "perfil-da-loja-2" }) },
      perfilLojaAcesso: { findFirst: jest.fn().mockResolvedValue({ id: "acesso-1" }) },
    });

    const escopo = await service.resolver(admin, { [HEADER_LOJA]: "loja-2" });
    expect(escopo.lojaId).toBe("loja-2");
  });

  // Retrocompatibilidade: nenhum ADMIN de hoje tem Perfil, e todos eles
  // precisam continuar administrando a empresa inteira.
  it("ADMIN sem Perfil continua alcançando qualquer loja da empresa", async () => {
    const { service } = makeService({
      loja: { findFirst: jest.fn().mockResolvedValue({ id: "loja-7", clienteId: "cliente-a" }) },
      user: { findUnique: jest.fn().mockResolvedValue({ role: "ADMIN", perfilId: null }) },
    });

    const escopo = await service.resolver(admin, { [HEADER_LOJA]: "loja-7" });
    expect(escopo.lojaId).toBe("loja-7");
  });

  it("permite loja dentro do Perfil de um OPERADOR", async () => {
    const operador = { ...admin, role: "OPERADOR" };
    const { service } = makeService({
      loja: { findFirst: jest.fn().mockResolvedValue({ id: "loja-9", clienteId: "cliente-a" }) },
      user: { findUnique: jest.fn().mockResolvedValue({ perfilId: "perfil-1" }) },
      perfilLojaAcesso: { findFirst: jest.fn().mockResolvedValue({ id: "acesso-1" }) },
    });

    const escopo = await service.resolver(operador, { [HEADER_LOJA]: "loja-9" });
    expect(escopo.lojaId).toBe("loja-9");
  });

  it("não deixa um ADMIN trocar de empresa pelo cabeçalho", async () => {
    const { service } = makeService({
      cliente: { findUnique: jest.fn().mockResolvedValue({ id: "cliente-b" }) },
    });

    const escopo = await service.resolver(admin, { [HEADER_CLIENTE]: "cliente-b" });
    expect(escopo.clienteId).toBe("cliente-a");
  });

  it("não deixa um SUPERADMIN travado na empresa (scoped) trocar de empresa", async () => {
    const superScoped = { ...admin, role: "SUPERADMIN", scoped: true };
    const { service } = makeService({
      cliente: { findUnique: jest.fn().mockResolvedValue({ id: "cliente-b" }) },
    });

    const escopo = await service.resolver(superScoped, { [HEADER_CLIENTE]: "cliente-b" });
    expect(escopo.clienteId).toBe("cliente-a");
  });

  it("deixa o SUPERADMIN global trocar de empresa e re-resolve a loja", async () => {
    const superGlobal = { ...admin, role: "SUPERADMIN", scoped: false };
    const { service } = makeService({
      cliente: { findUnique: jest.fn().mockResolvedValue({ id: "cliente-b" }) },
      loja: { findFirst: jest.fn().mockResolvedValue({ id: "loja-b1", clienteId: "cliente-b" }) },
    });

    const escopo = await service.resolver(superGlobal, { [HEADER_CLIENTE]: "cliente-b" });
    expect(escopo).toEqual({ clienteId: "cliente-b", lojaId: "loja-b1" });
  });
});
