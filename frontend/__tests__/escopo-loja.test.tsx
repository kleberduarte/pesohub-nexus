import { render, waitFor } from "@testing-library/react";
import DashboardLayout from "../app/(dashboard)/layout";
import { authApi, clientesApi, getCurrentUser, lojasApi } from "../lib/api";

/**
 * Adoção automática da primeira loja (encontrado em produção, 01/09).
 *
 * Quem cadastrava a PRIMEIRA loja ficava travado: o escopo da aba seguia com
 * `lojaId: null`, e as ações que exigem loja — gerar Agent Local, por exemplo —
 * falhavam pedindo "troque de loja". Impossível, havendo uma só.
 *
 * Pior: o `<select>` exibia a loja (era a primeira opção) enquanto seu valor
 * real era "", então escolher a opção já mostrada não disparava o `onChange`.
 * Não havia saída pela interface.
 */
jest.mock("../lib/api", () => ({
  authApi: { me: jest.fn(), switchLoja: jest.fn(), logout: jest.fn() },
  lojasApi: { list: jest.fn() },
  clientesApi: { branding: jest.fn() },
  getCurrentUser: jest.fn(),
  setActiveClienteToken: jest.fn(),
  applyBranding: jest.fn(),
  ApiError: class ApiError extends Error {},
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/devices",
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

const LOJA = { id: "loja-1", nome: "Loja Matriz Ramuza" };

beforeEach(() => {
  jest.clearAllMocks();
  (lojasApi.list as jest.Mock).mockResolvedValue([LOJA]);
  (authApi.me as jest.Mock).mockResolvedValue({ sub: "u1", clienteId: "c-1", lojaId: null });
  (clientesApi.branding as jest.Mock).mockResolvedValue({});
});

describe("Escopo de loja na sessão", () => {
  // A regressão. Sem isso, a primeira loja cadastrada nunca vira loja ativa.
  it("adota a primeira loja quando a sessão não tem nenhuma ativa", async () => {
    (getCurrentUser as jest.Mock).mockReturnValue({ sub: "u1", clienteId: "c-1", lojaId: null });
    (authApi.switchLoja as jest.Mock).mockResolvedValue({ user: { ...LOJA, lojaId: "loja-1" } });

    render(<DashboardLayout>conteudo</DashboardLayout>);

    await waitFor(() => expect(authApi.switchLoja).toHaveBeenCalledWith("loja-1"));
  });

  it("não troca a loja de quem já tem uma ativa", async () => {
    (getCurrentUser as jest.Mock).mockReturnValue({ sub: "u1", clienteId: "c-1", lojaId: "loja-9" });

    render(<DashboardLayout>conteudo</DashboardLayout>);
    await waitFor(() => expect(lojasApi.list).toHaveBeenCalled());

    expect(authApi.switchLoja).not.toHaveBeenCalled();
  });

  it("não tenta adotar loja nenhuma quando a empresa não tem lojas", async () => {
    (getCurrentUser as jest.Mock).mockReturnValue({ sub: "u1", clienteId: "c-1", lojaId: null });
    (lojasApi.list as jest.Mock).mockResolvedValue([]);

    render(<DashboardLayout>conteudo</DashboardLayout>);
    await waitFor(() => expect(lojasApi.list).toHaveBeenCalled());

    expect(authApi.switchLoja).not.toHaveBeenCalled();
  });
});
