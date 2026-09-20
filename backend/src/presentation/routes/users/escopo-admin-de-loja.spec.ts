import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { EscopoAdminGuard } from "../../middleware/escopo-admin.guard";

/**
 * Cards #83/#84/#85 — "ADMIN de loja" é ADMIN + Perfil de uma loja só.
 *
 * O plano de DADOS já era filtrado pela loja do request; o buraco estava no
 * plano ADMINISTRATIVO, cliente-wide: `GET /users` devolvia a empresa inteira
 * para qualquer ADMIN. Se só as fases 1 e 2 saíssem, o gerente pararia de
 * trocar de loja e continuaria lendo e editando todos os usuários da rede —
 * pareceria resolvido sem estar.
 *
 * O critério é CONTER, não intersectar: quem administra a Loja 1 não alcança
 * quem alcança as Lojas 1 e 2.
 */

const GERENTE_LOJA_1 = { sub: "gerente-1", role: "ADMIN", clienteId: "cliente-a" };

/** Usuários como o `findMany` do controller os devolve. */
const equipe = [
  { id: "gerente-1", email: "g1@rede.com.br", role: "ADMIN", createdAt: new Date(), perfilId: "p-loja-1", perfil: { nome: "Loja: 1", lojas: [{ lojaId: "loja-1" }] }, lockedUntil: null, mustChangePassword: false, passwordChangedAt: null, tokensSenha: [] },
  { id: "op-loja-1", email: "op1@rede.com.br", role: "OPERADOR", createdAt: new Date(), perfilId: "p-loja-1", perfil: { nome: "Loja: 1", lojas: [{ lojaId: "loja-1" }] }, lockedUntil: null, mustChangePassword: false, passwordChangedAt: null, tokensSenha: [] },
  { id: "op-loja-2", email: "op2@rede.com.br", role: "OPERADOR", createdAt: new Date(), perfilId: "p-loja-2", perfil: { nome: "Loja: 2", lojas: [{ lojaId: "loja-2" }] }, lockedUntil: null, mustChangePassword: false, passwordChangedAt: null, tokensSenha: [] },
  { id: "gerente-rede", email: "chefe@rede.com.br", role: "ADMIN", createdAt: new Date(), perfilId: null, perfil: null, lockedUntil: null, mustChangePassword: false, passwordChangedAt: null, tokensSenha: [] },
  { id: "multi-loja", email: "multi@rede.com.br", role: "ADMIN", createdAt: new Date(), perfilId: "p-1-e-2", perfil: { nome: "Lojas 1 e 2", lojas: [{ lojaId: "loja-1" }, { lojaId: "loja-2" }] }, lockedUntil: null, mustChangePassword: false, passwordChangedAt: null, tokensSenha: [] },
];

/** `perfilId` de cada conta, como o controller consulta ao resolver escopo. */
const perfilDe: Record<string, string | null> = {
  "gerente-1": "p-loja-1",
  "gerente-rede": null,
  "op-loja-2": "p-loja-2",
};

function makeController(over: Record<string, unknown> = {}) {
  const prisma = {
    user: {
      findMany: jest.fn().mockResolvedValue(equipe),
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        const achado = equipe.find((u) => u.id === where.id);
        return Promise.resolve(
          achado
            ? { ...achado, clienteId: "cliente-a", perfilId: perfilDe[achado.id] ?? achado.perfilId }
            : null,
        );
      }),
      create: jest.fn().mockResolvedValue({ id: "novo" }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    perfilLojaAcesso: {
      // O escopo do solicitante: só a Loja 1.
      findMany: jest.fn().mockResolvedValue([{ lojaId: "loja-1" }]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    perfil: { findFirst: jest.fn().mockResolvedValue(null) },
    cliente: { findUnique: jest.fn().mockResolvedValue({ dominio: "rede.com.br" }) },
    loja: { findFirst: jest.fn().mockResolvedValue(null) },
    ...over,
  };
  const auditLog = { record: jest.fn().mockResolvedValue(undefined) };
  return { controller: new UsersController(prisma as never, auditLog as never, {} as never), prisma };
}

const req = { user: GERENTE_LOJA_1 } as never;

describe("GET /users — recorte por escopo", () => {
  it("o gerente de uma loja não enxerga a empresa inteira", async () => {
    const { controller } = makeController();

    const lista = (await controller.list(req)) as { id: string }[];
    const ids = lista.map((u) => u.id);

    expect(ids).toContain("op-loja-1");
    expect(ids).not.toContain("op-loja-2");
  });

  it("não enxerga quem administra a rede inteira (perfil nulo = todas as lojas)", async () => {
    const { controller } = makeController();

    const ids = ((await controller.list(req)) as { id: string }[]).map((u) => u.id);

    expect(ids).not.toContain("gerente-rede");
  });

  it("conter, não intersectar: quem alcança lojas 1 e 2 fica fora da lista de quem só alcança a 1", async () => {
    const { controller } = makeController();

    const ids = ((await controller.list(req)) as { id: string }[]).map((u) => u.id);

    expect(ids).not.toContain("multi-loja");
  });

  it("a própria conta nunca some da lista", async () => {
    const { controller } = makeController();

    const ids = ((await controller.list(req)) as { id: string }[]).map((u) => u.id);

    expect(ids).toContain("gerente-1");
  });

  it("quem administra a empresa inteira continua vendo todo mundo", async () => {
    const { controller } = makeController();
    const chefe = { user: { sub: "gerente-rede", role: "ADMIN", clienteId: "cliente-a" } } as never;

    const ids = ((await controller.list(chefe)) as { id: string }[]).map((u) => u.id);

    expect(ids).toHaveLength(equipe.length);
  });

  it("não vaza o id do perfil para a tela", async () => {
    const { controller } = makeController();

    const lista = (await controller.list(req)) as Record<string, unknown>[];

    expect(lista[0]).not.toHaveProperty("perfilId");
  });
});

describe("Ações sobre um usuário fora do escopo", () => {
  // Esconder da lista sem fechar a rota seria teatro: bastaria o id na URL.
  it("editar responde 'não encontrado', não 'sem permissão'", async () => {
    const { controller } = makeController();

    await expect(controller.update("op-loja-2", { role: "VIEWER" }, req)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("excluir responde 'não encontrado'", async () => {
    const { controller } = makeController();

    await expect(controller.remove("op-loja-2", req)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("desbloquear responde 'não encontrado'", async () => {
    const { controller } = makeController();

    await expect(controller.desbloquear("op-loja-2", req)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("dentro do escopo, a ação prossegue", async () => {
    const { controller, prisma } = makeController();

    await controller.desbloquear("op-loja-1", req);

    expect(prisma.user.update).toHaveBeenCalled();
  });
});

describe("Criação de usuário por quem administra só algumas lojas", () => {
  it("recusa criar usuário sem escopo — ele enxergaria a empresa inteira", async () => {
    const { controller } = makeController();

    await expect(
      controller.create({ email: "novo@rede.com.br", senha: "Senha!Forte1", role: "OPERADOR" } as never, req),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("recusa criar usuário numa loja fora do seu acesso", async () => {
    const { controller } = makeController();

    await expect(
      controller.create(
        { email: "novo@rede.com.br", senha: "Senha!Forte1", role: "OPERADOR", lojaId: "loja-2" } as never,
        req,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe("EscopoAdminGuard — ações que são da empresa, não da loja", () => {
  function makeGuard(perfilId: string | null, exige = true) {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({ perfilId }) } };
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(exige) };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { sub: "u1" } }) }),
      getHandler: () => null,
      getClass: () => null,
    };
    return { guard: new EscopoAdminGuard(reflector as never, prisma as never), ctx: ctx as never };
  }

  it("barra quem tem escopo de loja", async () => {
    const { guard, ctx } = makeGuard("p-loja-1");

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("libera quem administra a empresa inteira", async () => {
    const { guard, ctx } = makeGuard(null);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it("rota sem a marca não é afetada", async () => {
    const { guard, ctx } = makeGuard("p-loja-1", false);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
