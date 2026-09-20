import { BadRequestException } from "@nestjs/common";
import { PerfisController } from "./perfis.controller";

/**
 * Achado da auditoria do card #88: `lojaIds` era gravado direto, sem conferir
 * de quem a loja é. Bastava conhecer o id de uma loja de outra empresa para
 * vincular o próprio Perfil a ela — e a resposta, que inclui `loja`, devolvia
 * o cadastro dessa loja de volta para um concorrente.
 *
 * O vínculo não abria os dados operacionais (o escopo da sessão refiltra a
 * loja por empresa), mas vazava cadastro e deixava uma linha cross-tenant no
 * banco esperando o próximo consumidor que confiasse nela.
 */
function makeController(lojasDaEmpresa: string[]) {
  const prisma = {
    loja: {
      findMany: jest.fn(({ where }: { where: { id: { in: string[] }; clienteId: string } }) =>
        Promise.resolve(
          where.id.in.filter((id) => lojasDaEmpresa.includes(id) && where.clienteId === "empresa-a").map((id) => ({ id })),
        ),
      ),
    },
    perfil: {
      create: jest.fn().mockResolvedValue({ id: "novo" }),
      findFirst: jest.fn().mockResolvedValue({ id: "p1", nome: "Operação" }),
      update: jest.fn().mockResolvedValue({ id: "p1" }),
    },
    perfilLojaAcesso: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
  };
  return { controller: new PerfisController(prisma as never), prisma };
}

const req = { user: { clienteId: "empresa-a" } } as never;

it("recusa criar perfil com loja de outra empresa", async () => {
  const { controller, prisma } = makeController(["loja-da-empresa-a"]);

  await expect(
    controller.create({ nome: "Operação", lojaIds: ["loja-de-outra-empresa"] } as never, req),
  ).rejects.toBeInstanceOf(BadRequestException);
  expect(prisma.perfil.create).not.toHaveBeenCalled();
});

it("recusa quando só UMA das lojas é de fora", async () => {
  const { controller } = makeController(["loja-da-empresa-a"]);

  await expect(
    controller.create({ nome: "Mista", lojaIds: ["loja-da-empresa-a", "loja-de-outra-empresa"] } as never, req),
  ).rejects.toBeInstanceOf(BadRequestException);
});

it("a recusa não diz qual id falhou, para não confirmar a existência da loja alheia", async () => {
  const { controller } = makeController(["loja-da-empresa-a"]);

  await expect(
    controller.create({ nome: "Operação", lojaIds: ["loja-de-outra-empresa"] } as never, req),
  ).rejects.toThrow(/não pertencem a esta empresa/);
  await expect(
    controller.create({ nome: "Operação", lojaIds: ["loja-de-outra-empresa"] } as never, req),
  ).rejects.not.toThrow(/loja-de-outra-empresa/);
});

it("editar também recusa loja de outra empresa", async () => {
  const { controller, prisma } = makeController(["loja-da-empresa-a"]);

  await expect(
    controller.update("p1", { lojaIds: ["loja-de-outra-empresa"] } as never, req),
  ).rejects.toBeInstanceOf(BadRequestException);
  // A checagem vem ANTES de apagar os vínculos: uma edição recusada não pode
  // deixar o perfil sem loja nenhuma.
  expect(prisma.perfilLojaAcesso.deleteMany).not.toHaveBeenCalled();
});

it("lojas da própria empresa passam normalmente", async () => {
  const { controller, prisma } = makeController(["loja-1", "loja-2"]);

  await controller.create({ nome: "Operação", lojaIds: ["loja-1", "loja-2"] } as never, req);

  expect(prisma.perfil.create).toHaveBeenCalled();
});

it("perfil sem loja nenhuma continua válido", async () => {
  const { controller, prisma } = makeController([]);

  await controller.create({ nome: "Sem lojas" } as never, req);

  expect(prisma.perfil.create).toHaveBeenCalled();
});
