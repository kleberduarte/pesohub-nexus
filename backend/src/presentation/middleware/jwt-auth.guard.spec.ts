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

  function makeReflector(skipBillingCheck = false) {
    return { getAllAndOverride: jest.fn(() => skipBillingCheck) } as any;
  }

  it("rejeita requisição sem cookie de sessão", async () => {
    const guard = new JwtAuthGuard({} as any, {} as any, makeReflector());
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(UnauthorizedException);
  });

  it("rejeita token inválido", async () => {
    const jwt = { verify: jest.fn(() => { throw new Error("bad token"); }) };
    const guard = new JwtAuthGuard(jwt as any, {} as any, makeReflector());
    await expect(guard.canActivate(makeContext({ [AUTH_COOKIE_NAME]: "xxx" }))).rejects.toThrow(UnauthorizedException);
  });

  it("aceita token válido e popula request.user", async () => {
    const payload = { sub: "user-1", clienteId: "cliente-a", role: "ADMIN" };
    const jwt = { verify: jest.fn(() => payload) };
    const prisma = { assinatura: { findUnique: jest.fn(() => null) } };
    const guard = new JwtAuthGuard(jwt as any, prisma as any, makeReflector());
    const context = makeContext({ [AUTH_COOKIE_NAME]: "valid" });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual(payload);
  });

  it("bloqueia tenant com assinatura inadimplente", async () => {
    const payload = { sub: "user-1", clienteId: "cliente-a", role: "ADMIN" };
    const jwt = { verify: jest.fn(() => payload) };
    const prisma = { assinatura: { findUnique: jest.fn(() => ({ status: "INADIMPLENTE" })) } };
    const guard = new JwtAuthGuard(jwt as any, prisma as any, makeReflector());
    const context = makeContext({ [AUTH_COOKIE_NAME]: "valid" });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it("permite SUPERADMIN mesmo com assinatura inadimplente", async () => {
    const payload = { sub: "user-1", clienteId: "cliente-a", role: "SUPERADMIN" };
    const jwt = { verify: jest.fn(() => payload) };
    const prisma = { assinatura: { findUnique: jest.fn(() => ({ status: "INADIMPLENTE" })) } };
    const guard = new JwtAuthGuard(jwt as any, prisma as any, makeReflector());
    const context = makeContext({ [AUTH_COOKIE_NAME]: "valid" });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
