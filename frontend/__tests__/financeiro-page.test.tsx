import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FinanceiroPage from "../app/(dashboard)/financeiro/page";
import { billingApi } from "../lib/api";

/**
 * Card #98 — painel financeiro. O risco desta tela é um clique emitir boleto
 * real, então o teste central é a confirmação antes de cobrar.
 */
jest.mock("../lib/api", () => ({
  billingApi: { painel: jest.fn(), fecharCompetenciaDe: jest.fn() },
  getCurrentUser: () => ({ role: "SUPERADMIN", email: "superadmin@pesohub.com.br" }),
  ApiError: class ApiError extends Error {},
}));

const painel = {
  resumo: {
    receitaMensalPrevista: 16120,
    mensalidadeRedes: 120,
    mensalidadeContratos: 16000,
    emAtraso: 40,
    recebidoNoMes: 16000,
    assinaturasAtivas: 1,
    assinaturasAguardando: 0,
    assinaturasEmAtraso: 1,
    contratosAtivos: 1,
  },
  contratos: [
    {
      id: "c1",
      empresa: "Ramuza",
      clienteId: "ramuza",
      ativo: true,
      valorUnitario: 40,
      quantidadeMinima: 400,
      diaVencimento: 10,
      temClienteNoAsaas: true,
      previa: {
        competencia: "2026-09",
        quantidadeApurada: 1,
        quantidadeFaturada: 400,
        valorUnitario: 40,
        valorTotal: 16000,
      },
      competencias: [],
    },
  ],
  assinaturas: [
    {
      id: "a1",
      empresa: "Ramuza",
      clienteId: "ramuza",
      rede: "davo.com.br",
      situacao: "ATIVA",
      formaPagamento: "PIX",
      valorUnitario: 40,
      quantidadeMinima: 1,
      balancasCobradas: 2,
      balancasHoje: 3,
      valor: 80,
      valorPrevisto: 120,
      proximoVencimento: "2026-10-05T00:00:00.000Z",
      ultimaFatura: null,
    },
    {
      id: "a2",
      empresa: "Ramuza",
      clienteId: "ramuza",
      rede: "redeavo.com.br",
      situacao: "BLOQUEADA",
      formaPagamento: "BOLETO",
      valorUnitario: 40,
      quantidadeMinima: 1,
      balancasCobradas: 1,
      balancasHoje: 1,
      valor: 40,
      valorPrevisto: 40,
      proximoVencimento: "2026-09-01T00:00:00.000Z",
      ultimaFatura: null,
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  (billingApi.painel as jest.Mock).mockResolvedValue(painel);
  (billingApi.fecharCompetenciaDe as jest.Mock).mockResolvedValue({
    id: "f1",
    competencia: "2026-08",
    status: "COBRADA",
    linkPagamento: "https://asaas/boleto",
  });
});

describe("Painel financeiro", () => {
  it("mostra o previsto e o atraso separados", async () => {
    render(<FinanceiroPage />);
    await screen.findByText("R$ 16.120,00");
    // Recebido e atraso são indicadores próprios, não somados ao previsto.
    // "Em atraso" também é uma opção do filtro de situação; o cartão é o <p>.
    const cartao = (titulo: string) =>
      screen.getAllByText(titulo, { selector: "p" })[0].closest("div")?.parentElement as HTMLElement;
    expect(cartao("Recebido neste mês")).toHaveTextContent("R$ 16.000,00");
    expect(cartao("Em atraso")).toHaveTextContent("R$ 40,00");
  });

  it("avisa quando a cobrança está defasada em relação às balanças de hoje", async () => {
    render(<FinanceiroPage />);
    await screen.findByText("@davo.com.br");
    // Cobrando 2 balanças, mas já são 3 na rede.
    expect(screen.getByText("(hoje 3)")).toBeInTheDocument();
    expect(screen.getByText(/previsto R\$ 120,00/)).toBeInTheDocument();
  });

  it("filtra por situação", async () => {
    render(<FinanceiroPage />);
    await screen.findByText("@davo.com.br");

    await userEvent.selectOptions(screen.getByLabelText(/filtrar por situação/i), "BLOQUEADA");
    expect(screen.queryByText("@davo.com.br")).not.toBeInTheDocument();
    expect(screen.getByText("@redeavo.com.br")).toBeInTheDocument();
  });

  it("não emite cobrança sem a confirmação explícita", async () => {
    render(<FinanceiroPage />);
    await screen.findByRole("button", { name: /fechar uma competência/i });

    await userEvent.click(screen.getByRole("button", { name: /fechar uma competência/i }));
    const emitir = screen.getByRole("button", { name: /emitir cobrança/i });
    expect(emitir).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox"));
    expect(emitir).toBeEnabled();
    await userEvent.click(emitir);

    await waitFor(() => expect(billingApi.fecharCompetenciaDe).toHaveBeenCalled());
    expect((billingApi.fecharCompetenciaDe as jest.Mock).mock.calls[0][0]).toBe("ramuza");
  });

  it("nega acesso a quem não é o administrador do produto", async () => {
    const api = jest.requireMock("../lib/api");
    api.getCurrentUser = () => ({ role: "ADMIN", email: "admin@ramuza.com.br" });
    render(<FinanceiroPage />);
    expect(await screen.findByText(/não tem permissão/i)).toBeInTheDocument();
  });
});
