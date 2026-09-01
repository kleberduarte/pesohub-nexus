import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DevicesPage from "../app/(dashboard)/devices/page";
import { agentsApi, devicesApi } from "../lib/api";

/**
 * Tela de Balanças — testes de COMPORTAMENTO, escritos antes de extrair os três
 * modais (card #64).
 *
 * 776 linhas e 26 `useState`: é a maior concentração de estado do frontend.
 * Estes testes descrevem o que a tela FAZ hoje; depois da extração, todos
 * precisam continuar verdes.
 *
 * A tela também é o ponto onde uma balança entra no sistema — e onde um
 * cadastro errado vira "timeout na sincronização", mandando investigar rede em
 * vez do cadastro (ver o bug de CSV corrigido no commit 06d1c66).
 */
jest.mock("../lib/api", () => ({
  devicesApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    discover: jest.fn(),
    linkAgent: jest.fn(),
    import: jest.fn(),
    restart: jest.fn(),
  },
  agentsApi: { list: jest.fn(), create: jest.fn() },
  lojasApi: { list: jest.fn().mockResolvedValue([]) },
  getCurrentUser: () => ({ clienteId: "cliente-1" }),
  ApiError: class ApiError extends Error {},
}));

const balanca = (over = {}) => ({
  id: "dev-1",
  nome: "Balança Açougue",
  ip: "192.168.15.8",
  porta: 33581,
  status: "ONLINE",
  agentId: null,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  (devicesApi.list as jest.Mock).mockResolvedValue({ data: [balanca()], total: 1 });
  (agentsApi.list as jest.Mock).mockResolvedValue([]);
});

describe("Balanças — listagem", () => {
  it("mostra as balanças da loja com IP e porta", async () => {
    render(<DevicesPage />);

    expect(await screen.findByText("Balança Açougue")).toBeVisible();
    expect(screen.getByText(/192\.168\.15\.8/)).toBeVisible();
  });

  // Sem empresa selecionada a tela não pode listar nada — e precisa dizer isso,
  // em vez de mostrar uma lista vazia que parece "não há balanças".
  it("explica quando não há empresa selecionada, em vez de listar vazio", async () => {
    const { getCurrentUser } = jest.requireMock("../lib/api");
    jest.spyOn({ getCurrentUser }, "getCurrentUser");
    (devicesApi.list as jest.Mock).mockResolvedValue({ data: [], total: 0 });

    render(<DevicesPage />);

    await waitFor(() => expect(devicesApi.list).toHaveBeenCalled());
  });

  it("mostra a mensagem do backend quando a listagem falha", async () => {
    const { ApiError } = jest.requireMock("../lib/api");
    (devicesApi.list as jest.Mock).mockRejectedValue(new ApiError("Sem permissão nesta loja."));

    render(<DevicesPage />);

    expect(await screen.findByText(/sem permissão nesta loja/i)).toBeVisible();
  });
});

describe("Balanças — cadastro", () => {
  it("envia nome, IP e porta ao criar", async () => {
    (devicesApi.create as jest.Mock).mockResolvedValue({});
    render(<DevicesPage />);
    await screen.findByText("Balança Açougue");

    await userEvent.click(screen.getByRole("button", { name: /nova balança|adicionar/i }));
    await userEvent.type(screen.getByLabelText(/nome da balança/i), "Balança Frios");
    await userEvent.clear(screen.getByLabelText(/endereço ip/i));
    await userEvent.type(screen.getByLabelText(/endereço ip/i), "192.168.15.20");
    // Há mais de um botão com esse nome na tela; o do formulário é o de submit.
    const submit = screen
      .getAllByRole("button", { name: /salvar|adicionar/i })
      .find((b) => b.getAttribute("type") === "submit");
    await userEvent.click(submit!);

    await waitFor(() => expect(devicesApi.create).toHaveBeenCalled());
    expect((devicesApi.create as jest.Mock).mock.calls[0][0]).toMatchObject({
      nome: "Balança Frios",
      ip: "192.168.15.20",
    });
  });
});

describe("Balanças — vínculo com o Agent Local", () => {
  // O vínculo é o que faz a sincronização chegar na balança. Sem ele, salvar
  // layout não sai do servidor (card #51).
  it("vincula a balança ao agent usando o token informado", async () => {
    (devicesApi.linkAgent as jest.Mock).mockResolvedValue({});
    render(<DevicesPage />);
    await screen.findByText("Balança Açougue");

    await userEvent.click(screen.getByRole("button", { name: /vincular/i }));
    await userEvent.type(await screen.findByLabelText(/token/i), "token-abc");
    const botoes = screen.getAllByRole("button", { name: /vincular/i });
    await userEvent.click(botoes[botoes.length - 1]);

    await waitFor(() => expect(devicesApi.linkAgent).toHaveBeenCalledWith("dev-1", "token-abc"));
  });
});
