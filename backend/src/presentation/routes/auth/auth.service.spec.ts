import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";

/**
 * SUPERADMIN não tem clienteId fixo no banco — a empresa "ativa" só existia
 * no token emitido por switch-company, que se perdia a cada novo login
 * (login() sempre reconstruía o payload a partir de user.clienteId, null
 * para SUPERADMIN). Isso fazia a sessão "esquecer" a empresa selecionada
 * assim que o usuário deslogava e logava de novo. Trava essa regressão.
 */
describe("AuthService", () => {
  function makeService(user: any) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue(user),
      },
      cliente: {
        findUnique: jest.fn().mockResolvedValue({ id: "cliente-ramuza" }),
      },
    };
    const jwt = { sign: jest.fn((payload) => JSON.stringify(payload)) };
    const service = new AuthService(prisma as any, jwt as any);
    return { service, prisma, jwt };
  }

  it("login usa activeClienteId (última empresa trocada) para SUPERADMIN", async () => {
    const senha = await bcrypt.hash("senha123", 4);
    const { service, jwt } = makeService({
      id: "u1",
      email: "super@pesohub.com.br",
      senha,
      role: "SUPERADMIN",
      clienteId: null,
      activeClienteId: "cliente-ramuza",
    });

    await service.login("super@pesohub.com.br", "senha123");

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: "cliente-ramuza" }),
      expect.anything(),
    );
  });

  it("login de ADMIN/OPERADOR sempre usa o clienteId fixo (ignora activeClienteId)", async () => {
    const senha = await bcrypt.hash("senha123", 4);
    const { service, jwt } = makeService({
      id: "u2",
      email: "admin@empresa.com.br",
      senha,
      role: "ADMIN",
      clienteId: "cliente-toledo",
      activeClienteId: "cliente-ramuza",
    });

    await service.login("admin@empresa.com.br", "senha123");

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: "cliente-toledo" }),
      expect.anything(),
    );
  });

  it("switchCompany persiste activeClienteId no usuário", async () => {
    const { service, prisma } = makeService({
      id: "u1",
      role: "SUPERADMIN",
    });

    await service.switchCompany(
      { sub: "u1", email: "super@pesohub.com.br", role: "SUPERADMIN", clienteId: null },
      "cliente-ramuza",
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { activeClienteId: "cliente-ramuza" },
    });
  });
});
