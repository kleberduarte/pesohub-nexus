import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeclaAcessoRapidoPanel } from "../components/cadastros/TeclaAcessoRapidoPanel";
import { productsApi, teclasAcessoRapidoApi } from "../lib/api";

/**
 * Teclas de Acesso Rápido — 454 linhas, sem testes até aqui.
 *
 * É o teclado físico da balança: o operador aperta uma tecla e o produto
 * vinculado a ela é pesado. Um vínculo errado faz sair a etiqueta do produto
 * errado — com o preço errado — e ninguém percebe até o cliente reclamar.
 */
jest.mock("../lib/api", () => ({
  teclasAcessoRapidoApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
  productsApi: { listForPicker: jest.fn() },
  ApiError: class ApiError extends Error {},
}));

const teclado = (over = {}) => ({
  id: "t-1",
  nome: "Teclado Açougue",
  modelo: "MGV7",
  pagina: 1,
  layout: { keys: {} },
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  (teclasAcessoRapidoApi.list as jest.Mock).mockResolvedValue([teclado()]);
  (productsApi.listForPicker as jest.Mock).mockResolvedValue([
    { id: "p-1", codigo: "700", nome: "IOGURTE" },
    { id: "p-2", codigo: "800", nome: "QUEIJO" },
  ]);
  (teclasAcessoRapidoApi.update as jest.Mock).mockResolvedValue({});
});

describe("Teclas de Acesso Rápido — vínculo tecla ↔ produto", () => {
  /**
   * O vínculo é gravado por CÓDIGO, não por id interno: é o código que a
   * balança conhece. Guardar o id do banco aqui faria a tecla apontar para
   * nada no equipamento.
   */
  it("grava o código e o nome do produto na tecla escolhida", async () => {
    render(<TeclaAcessoRapidoPanel />);
    await userEvent.click(await screen.findByTitle(/editar teclado|teclado/i));

    const teclas = await screen.findAllByTitle("Tecla vazia");
    await userEvent.click(teclas[0]);
    await userEvent.click(await screen.findByText(/IOGURTE/));
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(teclasAcessoRapidoApi.update).toHaveBeenCalled());
    const payload = (teclasAcessoRapidoApi.update as jest.Mock).mock.calls[0][1];
    expect(Object.values(payload.layout.keys)[0]).toEqual({ codigo: "700", nome: "IOGURTE" });
  });
});

describe("Teclas de Acesso Rápido — busca de produto", () => {
  it("filtra por código e por nome", async () => {
    render(<TeclaAcessoRapidoPanel />);
    await userEvent.click(await screen.findByTitle(/editar teclado|teclado/i));

    const teclas = await screen.findAllByTitle("Tecla vazia");
    await userEvent.click(teclas[0]);

    const busca = await screen.findByPlaceholderText(/buscar|c[óo]digo/i);
    await userEvent.type(busca, "800");

    expect(await screen.findByText(/QUEIJO/)).toBeVisible();
    expect(screen.queryByText(/IOGURTE/)).not.toBeInTheDocument();
  });
});
