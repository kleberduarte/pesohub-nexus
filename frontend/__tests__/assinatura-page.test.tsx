import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssinaturaPage from "../app/(dashboard)/assinatura/page";
import { billingApi } from "../lib/api";

/**
 * Card #99 — a tela de cobrança do supermercado. O que se trava aqui é o que
 * o gerente precisa entender sem ligar para o suporte: de onde sai o valor,
 * quando vence, o que o atraso realmente bloqueia (e o que NÃO bloqueia), e
 * que cancelar não é um clique só.
 */
jest.mock("../lib/api", () => ({
  billingApi: { status: jest.fn(), subscribe: jest.fn(), cancel: jest.fn() },
  getCurrentUser: () => ({ role: "ADMIN_REDE", email: "gerente@davo.com.br" }),
  ApiError: class ApiError extends Error {
    status = 500;
  },
}));

const statusMock = billingApi.status as jest.Mock;
const cancelMock = billingApi.cancel as jest.Mock;
const subscribeMock = billingApi.subscribe as jest.Mock;

const assinaturaBase = {
  id: "a1",
  status: "ATIVA" as const,
  formaPagamento: "PIX" as const,
  valor: "80",
  valorUnitario: "40",
  quantidadeBalancas: 2,
  quantidadeMinima: 1,
  dominioRede: "davo.com.br",
  proximoVencimento: "2026-10-10T00:00:00.000Z",
  faturas: [],
  aguardandoAtivacao: false,
  previa: { quantidadeApurada: 2, quantidadeFaturada: 2, valorUnitario: 40, valorTotal: 80 },
  bloqueio: { situacao: "ATIVA" as const, bloqueado: false, diasDeCarencia: 7, bloqueiaEm: null },
};

beforeEach(() => {
  jest.clearAllMocks();
});

it("mostra o valor, o vencimento e a conta que gerou o valor", async () => {
  statusMock.mockResolvedValue(assinaturaBase);
  render(<AssinaturaPage />);

  // O mesmo valor aparece no topo e no bloco de consumo, de propósito.
  expect((await screen.findAllByText("R$ 80,00")).length).toBeGreaterThan(0);
  expect(screen.getByText(/Próxima cobrança em/)).toBeInTheDocument();
  expect(screen.getByText(/2 balanças ×/)).toBeInTheDocument();
});

it("avisa que a balança continua imprimindo quando a rede está em atraso", async () => {
  statusMock.mockResolvedValue({
    ...assinaturaBase,
    status: "INADIMPLENTE",
    bloqueio: {
      situacao: "ATRASADA",
      bloqueado: false,
      diasDeCarencia: 7,
      bloqueiaEm: "2026-10-17T00:00:00.000Z",
    },
  });
  render(<AssinaturaPage />);

  expect(await screen.findByText(/O bloqueio começa em/)).toBeInTheDocument();
  // O ponto do card: não deixar o gerente achar que a operação vai parar.
  expect(screen.getByText(/continuam pesando e imprimindo etiquetas/)).toBeInTheDocument();
});

it("chama de vencida a data que já passou, em vez de \"próxima cobrança\"", async () => {
  // Pego conferindo no navegador: em atraso, o topo anunciava a data vencida
  // como se ainda houvesse prazo.
  statusMock.mockResolvedValue({
    ...assinaturaBase,
    status: "INADIMPLENTE",
    bloqueio: { situacao: "BLOQUEADA", bloqueado: true, diasDeCarencia: 7, bloqueiaEm: null },
  });
  render(<AssinaturaPage />);

  expect(await screen.findByText(/^Venceu em /)).toBeInTheDocument();
  expect(screen.queryByText(/Próxima cobrança em/)).not.toBeInTheDocument();
});

it("mostra o que muda na próxima cobrança quando a quantidade de balanças mudou", async () => {
  statusMock.mockResolvedValue({
    ...assinaturaBase,
    previa: { quantidadeApurada: 3, quantidadeFaturada: 3, valorUnitario: 40, valorTotal: 120 },
  });
  render(<AssinaturaPage />);

  const aviso = await screen.findByText(/A próxima cobrança passa de/);
  expect(aviso).toHaveTextContent("R$ 80,00");
  expect(aviso).toHaveTextContent("R$ 120,00");
});

it("não inventa aviso de mudança quando o valor da próxima cobrança é o mesmo", async () => {
  statusMock.mockResolvedValue(assinaturaBase);
  render(<AssinaturaPage />);

  await screen.findAllByText("R$ 80,00");
  expect(screen.queryByText(/A próxima cobrança passa de/)).not.toBeInTheDocument();
});

it("pede a forma de pagamento quando a assinatura nasceu com a rede e não foi ativada", async () => {
  statusMock.mockResolvedValue({ ...assinaturaBase, status: "TRIAL", aguardandoAtivacao: true });
  render(<AssinaturaPage />);

  // O valor já aparece calculado — nada de formulário em branco.
  expect((await screen.findAllByText("R$ 80,00")).length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: /Ativar assinatura/ })).toBeInTheDocument();
  expect(screen.getByLabelText("CPF ou CNPJ")).toBeInTheDocument();
});

it("não oferece cancelamento para quem ainda nem ativou", async () => {
  statusMock.mockResolvedValue({ ...assinaturaBase, status: "TRIAL", aguardandoAtivacao: true });
  render(<AssinaturaPage />);

  await screen.findAllByText("R$ 80,00");
  expect(screen.queryByRole("button", { name: "Cancelar assinatura" })).not.toBeInTheDocument();
});

it("só cancela depois de confirmar, e explica o efeito antes", async () => {
  statusMock.mockResolvedValue(assinaturaBase);
  cancelMock.mockResolvedValue({});
  render(<AssinaturaPage />);

  await userEvent.click(await screen.findByRole("button", { name: "Cancelar assinatura" }));
  expect(cancelMock).not.toHaveBeenCalled();
  expect(screen.getByText(/trava cadastro e sincronização/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
  await waitFor(() => expect(cancelMock).toHaveBeenCalled());
});

it("ativa com a forma de pagamento escolhida", async () => {
  statusMock.mockResolvedValue({ ...assinaturaBase, status: "TRIAL", aguardandoAtivacao: true });
  subscribeMock.mockResolvedValue({});
  render(<AssinaturaPage />);

  await userEvent.click(await screen.findByRole("button", { name: /Boleto/ }));
  await userEvent.type(screen.getByLabelText("CPF ou CNPJ"), "12345678000199");
  await userEvent.click(screen.getByRole("button", { name: /Ativar assinatura/ }));

  await waitFor(() =>
    expect(subscribeMock).toHaveBeenCalledWith({ formaPagamento: "BOLETO", cpfCnpj: "12345678000199" }),
  );
});
