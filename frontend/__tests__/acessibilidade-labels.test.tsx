import { render, screen } from "@testing-library/react";
import LoginCard from "../components/auth/LoginCard";

/**
 * Associação label ↔ input nas telas de formulário.
 *
 * Encontrado por acidente: os testes do painel de Formato de Impressão e do
 * formulário de produtos falharam com "no form control was found associated to
 * that label". Uma varredura mostrou **71 labels em 19 arquivos** sem
 * associação — a maior parte do sistema era inacessível a leitor de tela, e o
 * login estava entre eles.
 *
 * `getByLabelText` é exatamente a consulta que um leitor de tela faz. Se ela
 * falhar aqui, a tela voltou a ser inacessível.
 */
jest.mock("../lib/api", () => ({
  authApi: { login: jest.fn() },
  setCurrentUser: jest.fn(),
  setSessionScope: jest.fn(),
  setLastSessionId: jest.fn(),
  takeSessionEndReason: () => null,
  getActiveClienteToken: () => null,
  ApiError: class ApiError extends Error {},
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Login — acessível por leitor de tela", () => {
  it("associa os campos de e-mail e senha aos seus rótulos", () => {
    render(<LoginCard branding={null} />);

    expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/^senha$/i)).toHaveAttribute("type", "password");
  });
});
