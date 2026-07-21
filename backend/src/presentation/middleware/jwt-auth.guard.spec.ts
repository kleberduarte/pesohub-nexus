import { UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AUTH_COOKIE_NAME } from "../routes/auth/auth-cookie";

describe("JwtAuthGuard", () => {
  function makeContext(cookies: Record<string, string>) {
    const request: any = { cookies };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
  }

  it("rejeita requisição sem cookie de sessão", () => {
    const guard = new JwtAuthGuard({} as any);
    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });

  it("rejeita token inválido", () => {
    const jwt = { verify: jest.fn(() => { throw new Error("bad token"); }) };
    const guard = new JwtAuthGuard(jwt as any);
    expect(() => guard.canActivate(makeContext({ [AUTH_COOKIE_NAME]: "xxx" }))).toThrow(UnauthorizedException);
  });

  it("aceita token válido e popula request.user", () => {
    const payload = { sub: "user-1", clienteId: "cliente-a" };
    const jwt = { verify: jest.fn(() => payload) };
    const guard = new JwtAuthGuard(jwt as any);
    const context = makeContext({ [AUTH_COOKIE_NAME]: "valid" });

    expect(guard.canActivate(context)).toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual(payload);
  });
});
