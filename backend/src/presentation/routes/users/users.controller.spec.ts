import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { UsersController } from "./users.controller";

/**
 * O bloqueio de conta (card #48) só é utilizável se houver como destravar.
 * Sem este endpoint, o único caminho era definir uma senha nova — o que
 * obriga o administrador a inventar e repassar uma senha, exatamente o hábito
 * que o card veio eliminar.
 */
describe("UsersController — desbloqueio de conta", () => {
  function makeController(target: any) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(target),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const auditLog = { record: jest.fn().mockResolvedValue(undefined) };
    return { controller: new UsersController(prisma as any, auditLog as any), prisma, auditLog };
  }

  const req = { user: { sub: "admin-1", role: "ADMIN", clienteId: "cliente-a" } } as any;

  it("zera as tentativas e remove o bloqueio, sem tocar na senha", async () => {
    const { controller, prisma } = makeController({
      id: "u1",
      email: "op@empresa.com.br",
      role: "OPERADOR",
      clienteId: "cliente-a",
    });

    await expect(controller.desbloquear("u1", req)).resolves.toEqual({ desbloqueado: true });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    // A senha não pode aparecer no update: destravar não é redefinir.
    expect(prisma.user.update.mock.calls[0][0].data).not.toHaveProperty("senha");
  });

  it("registra o desbloqueio na auditoria", async () => {
    const { controller, auditLog } = makeController({
      id: "u1",
      email: "op@empresa.com.br",
      role: "OPERADOR",
      clienteId: "cliente-a",
    });

    await controller.desbloquear("u1", req);

    expect(auditLog.record).toHaveBeenCalledWith(req, "users.desbloquear", {
      userId: "u1",
      email: "op@empresa.com.br",
    });
  });

  // Isolamento de tenant: um ADMIN não pode mexer em conta de outra empresa.
  it("não desbloqueia usuário de outra empresa", async () => {
    const { controller } = makeController({ id: "u1", role: "OPERADOR", clienteId: "cliente-b" });

    await expect(controller.desbloquear("u1", req)).rejects.toThrow(NotFoundException);
  });

  it("não deixa ADMIN desbloquear um SUPERADMIN", async () => {
    const { controller } = makeController({ id: "u1", role: "SUPERADMIN", clienteId: "cliente-a" });

    await expect(controller.desbloquear("u1", req)).rejects.toThrow(ForbiddenException);
  });
});
