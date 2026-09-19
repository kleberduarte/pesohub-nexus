import { BadRequestException, ConflictException } from "@nestjs/common";
import { PerfisController } from "./perfis.controller";

/**
 * Card #96 — o perfil "Rede: <domínio>" é o que impede um supermercado de ver
 * o outro. Apagá-lo ou editá-lo à mão deixaria funcionários sem escopo (vendo
 * tudo) ou com a loja de um concorrente.
 */
describe("PerfisController — perfis de rede são intocáveis", () => {
  const req = { user: { clienteId: "ramuza" } } as never;

  function montar(perfil: { id: string; nome: string }, usuarios = 0) {
    const prisma = {
      perfil: {
        findFirst: jest.fn().mockResolvedValue(perfil),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      perfilLojaAcesso: { deleteMany: jest.fn() },
      user: { count: jest.fn().mockResolvedValue(usuarios) },
    };
    return { controller: new PerfisController(prisma as never), prisma };
  }

  it("não apaga nem edita perfil de rede", async () => {
    const { controller, prisma } = montar({ id: "p", nome: "Rede: davo.com.br" });
    await expect(controller.remove("p", req)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.update("p", { lojaIds: ["avo-centro"] }, req)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.perfil.delete).not.toHaveBeenCalled();
    expect(prisma.perfilLojaAcesso.deleteMany).not.toHaveBeenCalled();
  });

  it("não deixa criar perfil com nome reservado de rede", async () => {
    const { controller } = montar({ id: "p", nome: "x" });
    await expect(controller.create({ nome: "Rede: qualquer" }, req)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("não apaga perfil em uso — o usuário ficaria vendo todas as lojas", async () => {
    const { controller, prisma } = montar({ id: "p", nome: "Gerente Regional" }, 3);
    await expect(controller.remove("p", req)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.perfil.delete).not.toHaveBeenCalled();
  });

  it("perfil comum sem uso pode ser apagado", async () => {
    const { controller, prisma } = montar({ id: "p", nome: "Gerente Regional" }, 0);
    await controller.remove("p", req);
    expect(prisma.perfil.delete).toHaveBeenCalledWith({ where: { id: "p" } });
  });
});
