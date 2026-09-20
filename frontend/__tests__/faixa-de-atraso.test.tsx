import { render, screen, waitFor } from "@testing-library/react";
import FaixaDeAtraso from "../components/billing/FaixaDeAtraso";
import { billingApi } from "../lib/api";

/**
 * Card #100 — a faixa que leva o aviso de atraso até onde a pessoa trabalha.
 * O que se trava aqui: ela só aparece quando há atraso, nunca derruba a
 * navegação, e sempre diz que a balança continua funcionando.
 */
let papelAtual = "ADMIN_REDE";

jest.mock("../lib/api", () => ({
  billingApi: { avisoDaRede: jest.fn() },
  getCurrentUser: () => ({ role: papelAtual, email: "gerente@davo.com.br" }),
}));

const avisoMock = billingApi.avisoDaRede as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  papelAtual = "ADMIN_REDE";
});

it("não mostra nada quando a rede está em dia", async () => {
  avisoMock.mockResolvedValue({ emAtraso: false });
  const { container } = render(<FaixaDeAtraso />);

  await waitFor(() => expect(avisoMock).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});

it("em atraso, mostra o valor, quando trava e que a balança segue funcionando", async () => {
  avisoMock.mockResolvedValue({
    emAtraso: true,
    situacao: "ATRASADA",
    valor: "120",
    vencimento: "2026-09-10T00:00:00.000Z",
    bloqueiaEm: "2026-09-17T00:00:00.000Z",
    diasDeCarencia: 7,
    linkPagamento: "https://asaas.test/i/1",
  });
  render(<FaixaDeAtraso />);

  expect(await screen.findByText(/R\$ 120,00 em atraso desde 10\/09\/2026/)).toBeInTheDocument();
  expect(screen.getByText(/O bloqueio começa em 17\/09\/2026/)).toBeInTheDocument();
  expect(screen.getByText(/seguem pesando e imprimindo/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Pagar agora" })).toHaveAttribute("href", "https://asaas.test/i/1");
});

it("bloqueada, diz o que está travado sem prometer prazo", async () => {
  avisoMock.mockResolvedValue({
    emAtraso: true,
    situacao: "BLOQUEADA",
    valor: "120",
    vencimento: "2026-08-10T00:00:00.000Z",
    bloqueiaEm: "2026-08-17T00:00:00.000Z",
    diasDeCarencia: 7,
    linkPagamento: null,
  });
  render(<FaixaDeAtraso />);

  expect(await screen.findByText(/Cadastro e sincronização bloqueados/)).toBeInTheDocument();
  expect(screen.queryByText(/O bloqueio começa em/)).not.toBeInTheDocument();
});

it("não manda quem não administra a rede para a tela de Assinatura", async () => {
  papelAtual = "OPERADOR";
  avisoMock.mockResolvedValue({
    emAtraso: true,
    situacao: "ATRASADA",
    valor: "120",
    vencimento: null,
    bloqueiaEm: null,
    diasDeCarencia: 7,
    linkPagamento: null,
  });
  render(<FaixaDeAtraso />);

  await screen.findByText(/em atraso/);
  expect(screen.queryByRole("link", { name: "Ver assinatura" })).not.toBeInTheDocument();
});

it("falha na consulta não derruba a navegação: a faixa apenas não aparece", async () => {
  avisoMock.mockRejectedValue(new Error("backend fora"));
  const { container } = render(<FaixaDeAtraso />);

  await waitFor(() => expect(avisoMock).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});
