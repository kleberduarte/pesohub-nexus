import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AUTH_COOKIE_NAME } from "../routes/auth/auth-cookie";

describe("JwtAuthGuard", () => {
  function makeContext(cookies: Record<string, string>) {
    const request: any = { cookies };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }


  function makeScope(resultado?: { clienteId: string | null; lojaId: string | null }) {
    return {
      resolver: jest.fn(async (user: any) => resultado ?? { clienteId: user.clienteId, lojaId: user.lojaId }),
    } as any;
  }

  function makeReflector(skipBillingCheck = false) {
    return { getAllAndOverride: jest.fn(() => skipBillingCheck) } as any;
  }

  function makeSessions(motivo: string | null = null, inativa = false) {
    return {
      motivoRevogacao: jest.fn().mockResolvedValue(motivo),
      expirouPorInatividade: jest.fn().mockResolvedValue(inativa),
      marcarAtividade: jest.fn().mockResolvedValue(undefined),
      revoke: jest.fn().mockResolvedValue(undefined),
    } as any;
  }

  it("rejeita requisição sem cookie de sessão", async () => {
    const guard = new JwtAuthGuard({} as any, {} as any, makeReflector(), makeSessions(), makeScope());
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(UnauthorizedException);
  });

  it("rejeita token inválido", async () => {
    const jwt = { verify: jest.fn(() => { throw new Error("bad token"); }) };
    const guard = new JwtAuthGuard(jwt as any, {} as any, makeReflector(), makeSessions(), makeScope());
    await expect(guard.canActivate(makeContext({ [AUTH_COOKIE_NAME]: "xxx" }))).rejects.toThrow(UnauthorizedException);
  });

  it("aceita token válido e popula request.user", async () => {
    const payload = { sub: "user-1", clienteId: "cliente-a", role: "ADMIN" };
    const jwt = { verify: jest.fn(() => payload) };
    const prisma = { assinatura: { findUnique: jest.fn(() => null) } };
    const guard = new JwtAuthGuard(jwt as any, prisma as any, makeReflector(), makeSessions(), makeScope());
    const context = makeContext({ [AUTH_COOKIE_NAME]: "valid" });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual(payload);
  });

  it("bloqueia tenant com assinatura inadimplente", async () => {
    const payload = { sub: "user-1", clienteId: "cliente-a", role: "ADMIN" };
    const jwt = { verify: jest.fn(() => payload) };
    const prisma = { assinatura: { findUnique: jest.fn(() => ({ status: "INADIMPLENTE" })) } };
    const guard = new JwtAuthGuard(jwt as any, prisma as any, makeReflector(), makeSessions(), makeScope());
    const context = makeContext({ [AUTH_COOKIE_NAME]: "valid" });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it("permite SUPERADMIN mesmo com assinatura inadimplente", async () => {
    const payload = { sub: "user-1", clienteId: "cliente-a", role: "SUPERADMIN" };
    const jwt = { verify: jest.fn(() => payload) };
    const prisma = { assinatura: { findUnique: jest.fn(() => ({ status: "INADIMPLENTE" })) } };
    const guard = new JwtAuthGuard(jwt as any, prisma as any, makeReflector(), makeSessions(), makeScope());
    const context = makeContext({ [AUTH_COOKIE_NAME]: "valid" });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});

describe("JwtAuthGuard e sessões revogadas", () => {
  function makeContext(cookies: Record<string, string>) {
    const request: any = { cookies };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  const payload = { sub: "user-1", clienteId: "cliente-a", lojaId: "loja-1", role: "ADMIN", jti: "sessao-1", exp: 999 };

  function makeScope() {
    return {
      resolver: jest.fn(async (user: any) => ({ clienteId: user.clienteId, lojaId: user.lojaId })),
    } as any;
  }
  const reflector = { getAllAndOverride: jest.fn(() => false) };

  function makeSessions(over: Record<string, unknown> = {}) {
    return {
      motivoRevogacao: jest.fn().mockResolvedValue(null),
      expirouPorInatividade: jest.fn().mockResolvedValue(false),
      marcarAtividade: jest.fn().mockResolvedValue(undefined),
      revoke: jest.fn().mockResolvedValue(undefined),
      ...over,
    } as any;
  }

  it("recusa um token válido cuja sessão foi encerrada no logout", async () => {
    const jwt = { verify: jest.fn(() => payload) };
    const sessions = makeSessions({ motivoRevogacao: jest.fn().mockResolvedValue("logout") });
    const guard = new JwtAuthGuard(jwt as any, {} as any, reflector as any, sessions as any, makeScope());

    await expect(guard.canActivate(makeContext({ [AUTH_COOKIE_NAME]: "valid" }))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(sessions.motivoRevogacao).toHaveBeenCalledWith("sessao-1");
  });

  // O ponto central do card #48: quem foi derrubado por um login em outro
  // lugar precisa saber disso — é o sinal de que alguém está na conta dele.
  it("explica quando a sessão caiu por acesso em outro dispositivo", async () => {
    const jwt = { verify: jest.fn(() => payload) };
    const sessions = makeSessions({ motivoRevogacao: jest.fn().mockResolvedValue("outro_dispositivo") });
    const guard = new JwtAuthGuard(jwt as any, {} as any, reflector as any, sessions as any, makeScope());

    await expect(guard.canActivate(makeContext({ [AUTH_COOKIE_NAME]: "valid" }))).rejects.toThrow(
      /acessada em outro dispositivo/i,
    );
  });

  it("expira a sessão parada além da janela de inatividade", async () => {
    const jwt = { verify: jest.fn(() => payload) };
    const sessions = makeSessions({ expirouPorInatividade: jest.fn().mockResolvedValue(true) });
    const guard = new JwtAuthGuard(jwt as any, {} as any, reflector as any, sessions as any, makeScope());

    await expect(guard.canActivate(makeContext({ [AUTH_COOKIE_NAME]: "valid" }))).rejects.toThrow(
      /inatividade/i,
    );
    expect(sessions.revoke).toHaveBeenCalledWith("sessao-1", 999, "inatividade");
  });

  it("renova a janela de inatividade a cada requisição autenticada", async () => {
    const jwt = { verify: jest.fn(() => payload) };
    const prisma = { assinatura: { findUnique: jest.fn(() => null) } };
    const sessions = makeSessions();
    const guard = new JwtAuthGuard(jwt as any, prisma as any, reflector as any, sessions as any, makeScope());

    await expect(guard.canActivate(makeContext({ [AUTH_COOKIE_NAME]: "valid" }))).resolves.toBe(true);
    expect(sessions.marcarAtividade).toHaveBeenCalledWith("sessao-1");
  });
});
