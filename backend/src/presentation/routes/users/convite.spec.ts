import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { ConviteService } from "./convite.service";
import { UsersController } from "./users.controller";
import { hashTokenSenha, statusConvite } from "../../../domain/services/token-senha";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { EmailService } from "../../../infrastructure/email/email.service";

const agora = new Date("2026-09-18T12:00:00Z");
const depois = (ms: number) => new Date(agora.getTime() + ms);

describe("statusConvite", () => {
  it("sem convite: conta normal", () => {
    expect(statusConvite(undefined, null, agora)).toBeNull();
  });
  it("não usado e no prazo: pendente", () => {
    expect(statusConvite({ usadoEm: null, expiraEm: depois(1000) }, null, agora)).toBe("pendente");
  });
  it("não usado e vencido: expirado", () => {
    expect(statusConvite({ usadoEm: null, expiraEm: depois(-1000) }, null, agora)).toBe("expirado");
  });
  it("queimado e senha gravada depois: aceito (conta normal)", () => {
    expect(statusConvite({ usadoEm: agora, expiraEm: depois(1000) }, depois(5), agora)).toBeNull();
  });
  it("queimado sem senha nova: cancelado", () => {
    expect(statusConvite({ usadoEm: agora, expiraEm: depois(1000) }, null, agora)).toBe("cancelado");
    expect(statusConvite({ usadoEm: agora, expiraEm: depois(1000) }, depois(-60_000), agora)).toBe("cancelado");
  });
});

function criarConviteService(enviarOk = true) {
  const prisma = {
    tokenSenha: {
      updateMany: jest.fn().mockReturnValue("updateMany"),
      create: jest.fn().mockReturnValue("create"),
    },
    $transaction: jest.fn(async (ops: unknown) => ops),
  };
  const email = {
    enviar: enviarOk ? jest.fn().mockResolvedValue({ id: "em_1" }) : jest.fn().mockRejectedValue(new Error("x")),
  };
  const config = { get: (k: string) => ({ CORS_ORIGIN: "https://app.exemplo.com,http://outro" })[k] };
  const servico = new ConviteService(
    prisma as unknown as PrismaService,
    email as unknown as EmailService,
    config as unknown as ConfigService,
  );
  return { servico, prisma, email };
}

describe("ConviteService", () => {
  it("invalida convites anteriores, grava só o hash e envia o link de aceite", async () => {
    const { servico, prisma, email } = criarConviteService();

    await expect(servico.enviar({ id: "u1", email: "nova@loja.com" }, "Ramuza")).resolves.toBe(true);

    expect(prisma.tokenSenha.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", tipo: "CONVITE", usadoEm: null },
      data: { usadoEm: expect.any(Date) },
    });
    const { tokenHash, tipo, expiraEm } = prisma.tokenSenha.create.mock.calls[0][0].data;
    expect(tipo).toBe("CONVITE");
    expect(expiraEm.getTime() - Date.now()).toBeGreaterThan(6 * 24 * 3600_000);

    const envio = email.enviar.mock.calls[0][0];
    const url: string = envio.conteudo.acao.url;
    expect(url.startsWith("https://app.exemplo.com/aceitar-convite?token=")).toBe(true);
    expect(tokenHash).toBe(hashTokenSenha(decodeURIComponent(url.split("token=")[1])));
    expect(envio.conteudo.paragrafos.join(" ")).toContain("Ramuza");
  });

  it("falha no e-mail devolve false, sem lançar (a conta já existe)", async () => {
    const { servico } = criarConviteService(false);
    await expect(servico.enviar({ id: "u1", email: "nova@loja.com" }, null)).resolves.toBe(false);
  });
});

describe("UsersController — convite", () => {
  const req = { user: { sub: "admin-1", role: "ADMIN", clienteId: "cliente-a" } } as never;

  function montar(target: unknown = null) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(target),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "novo", email: data.email, role: data.role })),
        update: jest.fn().mockResolvedValue({}),
      },
      cliente: { findUnique: jest.fn().mockResolvedValue({ nome: "Ramuza", dominio: "ramuza.com.br" }) },
      loja: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const auditLog = { record: jest.fn().mockResolvedValue(undefined) };
    const convites = { enviar: jest.fn().mockResolvedValue(true), cancelar: jest.fn().mockResolvedValue(1) };
    const controller = new UsersController(prisma as never, auditLog as never, convites as never);
    return { controller, prisma, auditLog, convites };
  }

  it("cria com senha que ninguém conhece, sem troca obrigatória, e envia o convite", async () => {
    const { controller, prisma, convites } = montar(null);
    const r = await controller.create({ email: "nova@ramuza.com.br", role: "OPERADOR", convidar: true }, req);

    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data.mustChangePassword).toBe(false);
    // A senha gravada é um hash de valor aleatório: nenhuma senha "óbvia" confere.
    expect(await bcrypt.compare("", data.senha)).toBe(false);
    expect(convites.enviar).toHaveBeenCalledWith(expect.objectContaining({ id: "novo" }), "Ramuza");
    expect(r).toMatchObject({ convite: "pendente", conviteEnviado: true });
  });

  it("sem convite e sem senha: recusa", async () => {
    const { controller } = montar(null);
    await expect(controller.create({ email: "nova@ramuza.com.br", role: "OPERADOR" }, req)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("caminho antigo (senha definida pelo admin) segue igual", async () => {
    const { controller, prisma, convites } = montar(null);
    await controller.create({ email: "nova@ramuza.com.br", role: "OPERADOR", senha: "Bx7#quelca9Z" }, req);
    expect(prisma.user.create.mock.calls[0][0].data.mustChangePassword).toBe(true);
    expect(convites.enviar).not.toHaveBeenCalled();
  });

  const convidado = (convite: unknown, extra: Record<string, unknown> = {}) => ({
    id: "u1",
    email: "nova@ramuza.com.br",
    role: "OPERADOR",
    clienteId: "cliente-a",
    passwordChangedAt: null,
    tokensSenha: convite ? [convite] : [],
    ...extra,
  });

  it("reenvia convite expirado", async () => {
    const { controller, convites } = montar(convidado({ usadoEm: null, expiraEm: new Date(Date.now() - 1000) }));
    await expect(controller.reenviarConvite("u1", req)).resolves.toMatchObject({ convite: "pendente" });
    expect(convites.enviar).toHaveBeenCalled();
  });

  it("não reenvia para quem já aceitou", async () => {
    const aceito = convidado({ usadoEm: new Date(1000), expiraEm: new Date(Date.now() + 1000) }, { passwordChangedAt: new Date(2000) });
    const { controller, convites } = montar(aceito);
    await expect(controller.reenviarConvite("u1", req)).rejects.toBeInstanceOf(BadRequestException);
    expect(convites.enviar).not.toHaveBeenCalled();
  });

  it("não mexe em convite de outra empresa", async () => {
    const { controller, convites } = montar(
      convidado({ usadoEm: null, expiraEm: new Date(Date.now() + 1000) }, { clienteId: "cliente-b" }),
    );
    await expect(controller.cancelarConvite("u1", req)).rejects.toBeInstanceOf(NotFoundException);
    expect(convites.cancelar).not.toHaveBeenCalled();
  });

  it("cancela convite pendente", async () => {
    const { controller, convites } = montar(convidado({ usadoEm: null, expiraEm: new Date(Date.now() + 1000) }));
    await expect(controller.cancelarConvite("u1", req)).resolves.toEqual({ convite: "cancelado" });
    expect(convites.cancelar).toHaveBeenCalledWith("u1");
  });

  it("senha definida pelo admin cancela o convite em aberto", async () => {
    const { controller, convites } = montar(convidado(null, { senha: "hash", senhasAnteriores: [] }));
    await controller.update("u1", { senha: "Bx7#quelca9Z" }, req);
    expect(convites.cancelar).toHaveBeenCalledWith("u1");
  });
});
