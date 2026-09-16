import { act, render } from "@testing-library/react";
import SessionKeepAlive from "../components/auth/SessionKeepAlive";
import { authApi } from "../lib/api";

/**
 * Card #78 — uma rajada de eventos de atividade disparava vários
 * POST /auth/refresh em paralelo, e cada um revogava a sessão do anterior: o
 * usuário era derrubado com "conta acessada em outro dispositivo" justamente
 * enquanto trabalhava.
 */
describe("SessionKeepAlive", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: Date.now() });
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("uma rajada de atividade gera um único refresh", async () => {
    let concluir!: () => void;
    const refresh = jest.spyOn(authApi, "refresh").mockImplementation(
      () =>
        new Promise((resolve) => {
          concluir = () => resolve({ user: { jti: "novo" } } as never);
        }),
    );

    render(<SessionKeepAlive />);
    jest.setSystemTime(Date.now() + 5 * 60 * 1000);

    act(() => {
      for (let i = 0; i < 20; i++) window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("keydown"));
      window.dispatchEvent(new Event("mousedown"));
    });
    expect(refresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      concluir();
    });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
