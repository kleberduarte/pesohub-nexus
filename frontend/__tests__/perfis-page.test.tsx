import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PerfisPage from "../app/(dashboard)/perfis/page";
import { lojasApi, perfisApi } from "../lib/api";

jest.mock("../lib/api", () => ({
  perfisApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
  lojasApi: { list: jest.fn() },
  ehPerfilDeRede: (nome: string) => nome.trim().toLowerCase().startsWith("rede:"),
  ApiError: class ApiError extends Error {},
}));

beforeEach(() => {
  jest.clearAllMocks();
  (lojasApi.list as jest.Mock).mockResolvedValue([
    { id: "loja-1", nome: "Matriz" },
    { id: "loja-2", nome: "Filial" },
  ]);
  (perfisApi.list as jest.Mock).mockResolvedValue([]);
  (perfisApi.create as jest.Mock).mockResolvedValue({ id: "p-1", nome: "Gerentes da Matriz", lojas: [] });
});

describe("Perfis — escopo de lojas (card #87)", () => {
  it("cria um perfil com o nome e as lojas marcadas", async () => {
    render(<PerfisPage />);
    await userEvent.click(await screen.findByRole("button", { name: /novo perfil/i }));
    await userEvent.type(screen.getByLabelText(/^nome$/i), "Gerentes da Matriz");
    await userEvent.click(screen.getByRole("checkbox", { name: "Matriz" }));
    await userEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(perfisApi.create).toHaveBeenCalled());
    expect((perfisApi.create as jest.Mock).mock.calls[0][0]).toEqual({
      nome: "Gerentes da Matriz",
      lojaIds: ["loja-1"],
    });
  });

  it("não deixa editar perfil automático de rede", async () => {
    (perfisApi.list as jest.Mock).mockResolvedValue([
      { id: "p-rede", nome: "Rede: davo.com.br", lojas: [{ lojaId: "loja-1", loja: { id: "loja-1", nome: "Matriz" } }] },
    ]);
    render(<PerfisPage />);
    expect(await screen.findByRole("button", { name: /perfis de rede não se editam/i })).toBeDisabled();
  });
});
