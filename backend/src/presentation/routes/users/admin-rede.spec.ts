import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { UsersController } from "./users.controller";

/**
 * Card #96 — Administrador da loja (ADMIN_REDE): o gerente do supermercado
 * cadastra a própria equipe sem pedir à Ramuza. O que se protege aqui é um
 * supermercado nunca mexer em (nem enxergar) gente de outro.
 */
describe("UsersController — Administrador da loja (ADMIN_REDE)", () => {
  const gerenteDavo = { user: { sub: "gerente-davo", role: "ADMIN_REDE", clienteId: "ramuza" } } as never;
  const adminRamuza = { user: { sub: "admin-ramuza", role: "ADMIN", clienteId: "ramuza" } } as never;

  const usuarios: Record<string, Record<string, unknown>> = {
    "gerente-davo": { id: "gerente-davo", email: "gerente@davo.com.br", role: "ADMIN_REDE", clienteId: "ramuza" },
    "admin-ramuza": { id: "admin-ramuza", email: "ana@ramuza.com.br", role: "ADMIN", clienteId: "ramuza" },
    "op-davo": { id: "op-davo", email: "joao@davo.com.br", role: "OPERADOR", clienteId: "ramuza", perfilId: "p-davo" },
    "op-avo": { id: "op-avo", email: "maria@redeavo.com.br", role: "OPERADOR", clienteId: "ramuza" },
    "op-loja-davo": {
      id: "op-loja-davo",
      email: "caixa@davo.com.br",
      role: "OPERADOR",
      clienteId: "ramuza",
      perfilId: "p-loja-mooca",
    },
  };

  function montar() {
    const prisma = {
      user: {
        findUnique: jest.fn(({ where }) => {
          if (where.id) return Promise.resolve(usuarios[where.id] ?? null);
          return Promise.resolve(null); // e-mail ainda não cadastrado
        }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "novo", ...data })),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      cliente: { findUnique: jest.fn().mockResolvedValue({ nome: "Ramuza", dominio: "ramuza.com.br" }) },
      loja: {
        findMany: jest.fn(({ where }) =>
          Promise.resolve(
            where.dominioEmail === "davo.com.br"
              ? [{ id: "davo-mooca" }, { id: "davo-tatuape" }]
              : [
                  { id: "davo-mooca", dominioEmail: "davo.com.br" },
                  { id: "davo-tatuape", dominioEmail: "davo.com.br" },
                  { id: "avo-centro", dominioEmail: "redeavo.com.br" },
                ],
          ),
        ),
      },
      perfil: {
        upsert: jest.fn().mockResolvedValue({ id: "p-davo" }),
        findUnique: jest.fn(({ where }) =>
          Promise.resolve(where.id === "p-davo" ? { nome: "Rede: davo.com.br" } : { nome: "Loja: Davo Mooca" }),
        ),
      },
      perfilLojaAcesso: { deleteMany: jest.fn(), createMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const auditLog = { record: jest.fn().mockResolvedValue(undefined) };
    const convites = { enviar: jest.fn().mockResolvedValue(true), cancelar: jest.fn().mockResolvedValue(1) };
    const controller = new UsersController(prisma as never, auditLog as never, convites as never);
    return { controller, prisma };
  }

  it("lista só as pessoas do próprio supermercado", async () => {
    const { controller, prisma } = montar();
    await controller.list(gerenteDavo);
    expect(prisma.user.findMany.mock.calls[0][0].where).toMatchObject({
      clienteId: "ramuza",
      email: { endsWith: "@davo.com.br" },
    });
  });

  it("o administrador da Ramuza continua vendo todo mundo", async () => {
    const { controller, prisma } = montar();
    await controller.list(adminRamuza);
    expect(prisma.user.findMany.mock.calls[0][0].where).not.toHaveProperty("email");
  });

  it("cadastra funcionário do próprio supermercado com acesso à rede", async () => {
    const { controller, prisma } = montar();
    await controller.create({ email: "novo@davo.com.br", role: "OPERADOR", convidar: true }, gerenteDavo);
    expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({ email: "novo@davo.com.br", perfilId: "p-davo" });
  });

  it("pode cadastrar outro Administrador da loja", async () => {
    const { controller, prisma } = montar();
    await controller.create({ email: "sub@davo.com.br", role: "ADMIN_REDE", convidar: true }, gerenteDavo);
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it("não cadastra e-mail de outro supermercado", async () => {
    const { controller, prisma } = montar();
    await expect(
      controller.create({ email: "x@redeavo.com.br", role: "OPERADOR", convidar: true }, gerenteDavo),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("não cadastra Administrador da empresa", async () => {
    const { controller } = montar();
    await expect(
      controller.create({ email: "x@davo.com.br", role: "ADMIN", convidar: true }, gerenteDavo),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("não edita, exclui nem desbloqueia gente de outro supermercado", async () => {
    const { controller, prisma } = montar();
    await expect(controller.update("op-avo", { role: "VIEWER" }, gerenteDavo)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(controller.remove("op-avo", gerenteDavo)).rejects.toBeInstanceOf(NotFoundException);
    await expect(controller.desbloquear("op-avo", gerenteDavo)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("não promove ninguém a Administrador da empresa", async () => {
    const { controller } = montar();
    await expect(controller.update("op-davo", { role: "ADMIN" }, gerenteDavo)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("promove a Administrador da loja só quem tem acesso à rede inteira", async () => {
    const { controller, prisma } = montar();
    await controller.update("op-davo", { role: "ADMIN_REDE" }, gerenteDavo);
    expect(prisma.user.update).toHaveBeenCalled();

    await expect(controller.update("op-loja-davo", { role: "ADMIN_REDE" }, gerenteDavo)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("o administrador da Ramuza também não transforma e-mail de supermercado em Administrador", async () => {
    const { controller } = montar();
    await expect(controller.update("op-davo", { role: "ADMIN" }, adminRamuza)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("não mexe em conta de Administrador da empresa, mesmo com e-mail do supermercado", async () => {
    const { controller, prisma } = montar();
    usuarios["admin-legado"] = { id: "admin-legado", email: "velho@davo.com.br", role: "ADMIN", clienteId: "ramuza" };
    await expect(controller.remove("admin-legado", gerenteDavo)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.update("admin-legado", { role: "VIEWER" }, gerenteDavo)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("promoção exige o perfil da PRÓPRIA rede, não qualquer perfil chamado 'Rede:'", async () => {
    const { controller, prisma } = montar();
    usuarios["op-misturado"] = {
      id: "op-misturado",
      email: "ze@davo.com.br",
      role: "OPERADOR",
      clienteId: "ramuza",
      perfilId: "p-falso",
    };
    prisma.perfil.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(where.id === "p-falso" ? { nome: "Rede: qualquer" } : { nome: "Rede: davo.com.br" }),
    );
    await expect(controller.update("op-misturado", { role: "ADMIN_REDE" }, gerenteDavo)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
