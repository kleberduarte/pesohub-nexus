import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { RedefinicaoSenhaService } from "./redefinicao-senha.service";
import { hashTokenSenha } from "../../../domain/services/token-senha";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { EmailService } from "../../../infrastructure/email/email.service";
import { SessionRevocationService } from "../../../infrastructure/auth/session-revocation.service";

const SENHA_ATUAL = "Atual#2026x";
const NOVA = "Nova#Segura2026";

async function montar(opcoes: { user?: boolean; queimou?: number } = {}) {
  const hashAtual = await bcrypt.hash(SENHA_ATUAL, 4);
  const user = { id: "u1", email: "fulano@loja.com", senha: hashAtual, senhasAnteriores: [] as string[] };
  const tx = {
    tokenSenha: { updateMany: jest.fn().mockResolvedValue({ count: opcoes.queimou ?? 1 }) },
    user: { update: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(opcoes.user === false ? null : user) },
    tokenSenha: {
      updateMany: jest.fn().mockReturnValue("updateMany"),
      create: jest.fn().mockReturnValue("create"),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (arg: unknown) => (typeof arg === "function" ? arg(tx) : arg)),
  };
  const email = { enviar: jest.fn().mockResolvedValue({ id: "em_1" }) };
  const sessions = { encerrarSessaoAtiva: jest.fn().mockResolvedValue(undefined) };
  const config = { get: (k: string) => ({ FRONTEND_URL: "https://app.exemplo.com/" })[k] };
  const servico = new RedefinicaoSenhaService(
    prisma as unknown as PrismaService,
    email as unknown as EmailService,
    sessions as unknown as SessionRevocationService,
    config as unknown as ConfigService,
  );
  return { servico, prisma, email, sessions, tx, user };
}

function registro(user: unknown, extra: Record<string, unknown> = {}) {
  return { id: "t1", tipo: "REDEFINICAO", usadoEm: null, expiraEm: new Date(Date.now() + 60_000), user, ...extra };
}

describe("RedefinicaoSenhaService.solicitar", () => {
  it("e-mail desconhecido: não cria token nem envia nada", async () => {
    const { servico, prisma, email } = await montar({ user: false });
    await servico.solicitar("ninguem@x.com");
    expect(prisma.tokenSenha.create).not.toHaveBeenCalled();
    expect(email.enviar).not.toHaveBeenCalled();
  });

  it("invalida links anteriores, grava só o hash e manda o token no link", async () => {
    const { servico, prisma, email } = await montar();
    await servico.solicitar("fulano@loja.com");

    expect(prisma.tokenSenha.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", tipo: "REDEFINICAO", usadoEm: null },
      data: { usadoEm: expect.any(Date) },
    });
    const { tokenHash } = prisma.tokenSenha.create.mock.calls[0][0].data;
    const url: string = email.enviar.mock.calls[0][0].conteudo.acao.url;
    expect(url.startsWith("https://app.exemplo.com/redefinir-senha?token=")).toBe(true);
    const token = decodeURIComponent(url.split("token=")[1]);
    expect(tokenHash).toBe(hashTokenSenha(token));
    expect(tokenHash).not.toBe(token);
  });

  it("falha no envio não vaza para quem pediu", async () => {
    const { servico, email } = await montar();
    email.enviar.mockRejectedValue(new Error("resend fora"));
    await expect(servico.solicitar("fulano@loja.com")).resolves.toBeUndefined();
  });
});

describe("RedefinicaoSenhaService.redefinir", () => {
  it.each([
    ["inexistente", null],
    ["expirado", { expiraEm: new Date(Date.now() - 1000) }],
    ["já usado", { usadoEm: new Date() }],
    ["de convite", { tipo: "CONVITE" }],
  ])("recusa link %s", async (_nome, extra) => {
    const { servico, prisma, tx } = await montar();
    prisma.tokenSenha.findUnique.mockResolvedValue(extra === null ? null : registro({}, extra));
    await expect(servico.redefinir("x".repeat(43), NOVA)).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("aplica a política de complexidade", async () => {
    const { servico, prisma, user } = await montar();
    prisma.tokenSenha.findUnique.mockResolvedValue(registro(user));
    await expect(servico.redefinir("x".repeat(43), "fraca")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("recusa repetir a senha atual", async () => {
    const { servico, prisma, user } = await montar();
    prisma.tokenSenha.findUnique.mockResolvedValue(registro(user));
    await expect(servico.redefinir("x".repeat(43), SENHA_ATUAL)).rejects.toThrow(/diferente da atual/);
  });

  it("sucesso: troca a senha, destrava a conta, queima o link e derruba a sessão", async () => {
    const { servico, prisma, tx, sessions, user } = await montar();
    prisma.tokenSenha.findUnique.mockResolvedValue(registro(user));

    await expect(servico.redefinir("x".repeat(43), NOVA)).resolves.toEqual({ id: "u1", email: user.email });

    expect(prisma.tokenSenha.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: hashTokenSenha("x".repeat(43)) } }),
    );
    const data = tx.user.update.mock.calls[0][0].data;
    expect(await bcrypt.compare(NOVA, data.senha)).toBe(true);
    expect(data).toMatchObject({ mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null });
    expect(data.senhasAnteriores).toContain(user.senha);
    expect(sessions.encerrarSessaoAtiva).toHaveBeenCalledWith("u1", "senha_redefinida");
  });

  it("sucesso queima também os outros links pendentes do usuário (ex.: convite não aceito)", async () => {
    const { servico, prisma, tx, user } = await montar();
    prisma.tokenSenha.findUnique.mockResolvedValue(registro(user));
    await servico.redefinir("x".repeat(43), NOVA);
    expect(tx.tokenSenha.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", usadoEm: null },
      data: { usadoEm: expect.any(Date) },
    });
  });

  it("aceitarConvite recusa link de redefinição, e vice-versa", async () => {
    const { servico, prisma, user } = await montar();
    prisma.tokenSenha.findUnique.mockResolvedValue(registro(user));
    await expect(servico.aceitarConvite("x".repeat(43), NOVA)).rejects.toThrow(/convite/i);
  });

  it("aceitarConvite com link de convite válido define a senha", async () => {
    const { servico, prisma, tx, user } = await montar();
    prisma.tokenSenha.findUnique.mockResolvedValue(registro(user, { tipo: "CONVITE" }));
    await expect(servico.aceitarConvite("x".repeat(43), NOVA)).resolves.toEqual({ id: "u1", email: user.email });
    expect(tx.user.update).toHaveBeenCalled();
  });

  it("dois cliques simultâneos: o que perde a queima não troca a senha", async () => {
    const { servico, prisma, tx, sessions, user } = await montar({ queimou: 0 });
    prisma.tokenSenha.findUnique.mockResolvedValue(registro(user));
    await expect(servico.redefinir("x".repeat(43), NOVA)).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(sessions.encerrarSessaoAtiva).not.toHaveBeenCalled();
  });
});
