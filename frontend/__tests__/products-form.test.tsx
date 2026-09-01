import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductsPage from "../app/(dashboard)/products/page";
import { productsApi } from "../lib/api";

/**
 * Formulário de produto (PLU) — testes de COMPORTAMENTO, escritos antes de
 * extrair o modal da página (card #64).
 *
 * O modal ocupa 560 das 1.094 linhas de `products/page.tsx` e depende de 29
 * `useState`. Refatorar isso sem rede é onde o retrabalho nasce: passa no
 * `tsc`, parece certo, e leva junto um comportamento que ninguém lembrava.
 *
 * Estes testes descrevem o que a tela FAZ hoje. Depois da extração, todos
 * precisam continuar verdes — é essa a definição de "não quebrei nada".
 */
jest.mock("../lib/api", () => ({
  productsApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(), removeAll: jest.fn() },
  subSetoresApi: { list: jest.fn().mockResolvedValue([]) },
  tabelasNutricionaisApi: { list: jest.fn().mockResolvedValue([]) },
  fornecedoresApi: { list: jest.fn().mockResolvedValue([]) },
  alergicosApi: { list: jest.fn().mockResolvedValue([]) },
  imagensApi: { list: jest.fn().mockResolvedValue([]) },
  formatosImpressaoApi: { list: jest.fn().mockResolvedValue([]) },
  // A pagina so carrega a lista se houver empresa ativa (products/page.tsx:122).
  getCurrentUser: () => ({ clienteId: "cliente-1" }),
  ApiError: class ApiError extends Error {},
}));

const abrirFormulario = async () => {
  render(<ProductsPage />);
  const botao = await screen.findByRole("button", { name: /novo produto|novo/i });
  await userEvent.click(botao);
};

const campo = (rotulo: RegExp) => screen.getByLabelText(rotulo);

beforeEach(() => {
  jest.clearAllMocks();
  (productsApi.list as jest.Mock).mockResolvedValue({ data: [], total: 0 });
  (productsApi.create as jest.Mock).mockResolvedValue({});
});

describe("Formulário de produto — preço", () => {
  it("aceita vírgula como separador decimal", async () => {
    await abrirFormulario();
    const preco = campo(/preço unitário/i);

    await userEvent.type(preco, "9,90");

    expect(preco).toHaveValue("9,90");
  });

  it("recusa letras sem apagar o que já foi digitado", async () => {
    await abrirFormulario();
    const preco = campo(/preço unitário/i);

    await userEvent.type(preco, "12abc");

    expect(preco).toHaveValue("12");
  });

  // A regressão que mais importa aqui. Os dois campos faziam
  // `setForm({ ...form, ... })` lendo `form` do closure — digitar preço e
  // depois custo podia fazer o segundo sobrescrever o primeiro com dado velho.
  // É a assinatura do bug de "preço perde teclas" já registrado no projeto.
  it("preserva o preço ao preencher o custo em seguida", async () => {
    await abrirFormulario();

    await userEvent.type(campo(/código do produto/i), "700");
    await userEvent.type(campo(/código de barras/i), "7891000100103");
    await userEvent.type(campo(/nome do produto/i), "IOGURTE");
    await userEvent.type(campo(/preço unitário/i), "9,90");
    await userEvent.type(campo(/custo \(r\$\)/i), "5,50");

    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(productsApi.create).toHaveBeenCalled());
    expect((productsApi.create as jest.Mock).mock.calls[0][0]).toMatchObject({
      preco: 9.9,
      custo: 5.5,
    });
  });
});

describe("Formulário de produto — salvar", () => {
  it("envia os campos preenchidos ao criar", async () => {
    await abrirFormulario();

    await userEvent.type(campo(/código do produto/i), "700");
    await userEvent.type(campo(/código de barras/i), "7891000100103");
    await userEvent.type(campo(/nome do produto/i), "IOGURTE");
    await userEvent.type(campo(/preço unitário/i), "9,90");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(productsApi.create).toHaveBeenCalled());
    expect((productsApi.create as jest.Mock).mock.calls[0][0]).toMatchObject({
      codigo: "700",
      nome: "IOGURTE",
      preco: 9.9,
    });
  });

  it("mostra a mensagem de erro do backend sem fechar o formulário", async () => {
    const { ApiError } = jest.requireMock("../lib/api");
    (productsApi.create as jest.Mock).mockRejectedValue(new ApiError("Código já cadastrado."));

    await abrirFormulario();
    await userEvent.type(campo(/código do produto/i), "700");
    await userEvent.type(campo(/código de barras/i), "7891000100103");
    await userEvent.type(campo(/nome do produto/i), "IOGURTE");
    await userEvent.type(campo(/preço unitário/i), "9,90");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    // A página renderiza o erro em dois lugares — no topo da lista e dentro do
    // modal — então há duas ocorrências. O que importa é que apareça.
    const ocorrencias = await screen.findAllByText(/código já cadastrado/i);
    expect(ocorrencias.length).toBeGreaterThan(0);
    expect(ocorrencias[0]).toBeVisible();
    expect(campo(/nome do produto/i)).toBeInTheDocument(); // o formulário continua aberto
  });
});
