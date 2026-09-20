import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComoPagarFatura from "../components/billing/ComoPagarFatura";
import { billingApi } from "../lib/api";

/**
 * Card #101 — pagar sem sair da tela. O que se trava aqui: o código copiado é
 * o código certo (copiar o valor errado manda dinheiro para o lugar errado),
 * e a ausência de uma forma de pagamento não derruba a outra.
 */
jest.mock("../lib/api", () => ({
  billingApi: { dadosDePagamento: jest.fn() },
  ApiError: class ApiError extends Error {
    status = 500;
  },
}));

const dadosMock = billingApi.dadosDePagamento as jest.Mock;

const COPIA_E_COLA = "00020126580014br.gov.bcb.pix0136chave-teste5204000053039865802BR";
const LINHA = "34191.79001 01043.510047 91020.150008 1 96610000012000";

const dados = {
  faturaId: "fat_1",
  valor: "120",
  status: "PENDENTE",
  dataVencimento: "2026-10-10T00:00:00.000Z",
  linkPagamento: "https://asaas.test/i/1",
  pix: { copiaECola: COPIA_E_COLA, qrCodeBase64: "iVBORw0KGgo=", expiraEm: null },
  boleto: { linhaDigitavel: LINHA, codigoDeBarras: "34191790" },
};

const areaDeTransferencia = { writeText: jest.fn(() => Promise.resolve()) };

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(navigator, { clipboard: areaDeTransferencia });
});

it("mostra o QR do Pix e a linha digitável do boleto", async () => {
  dadosMock.mockResolvedValue(dados);
  render(<ComoPagarFatura faturaId="fat_1" />);

  const qr = await screen.findByAltText(/QR Code do Pix/);
  expect(qr).toHaveAttribute("src", "data:image/png;base64,iVBORw0KGgo=");
  expect(screen.getByText(COPIA_E_COLA)).toBeInTheDocument();
  expect(screen.getByText(LINHA)).toBeInTheDocument();
});

it("copia exatamente o código Pix recebido", async () => {
  dadosMock.mockResolvedValue(dados);
  render(<ComoPagarFatura faturaId="fat_1" />);

  await userEvent.click(await screen.findByRole("button", { name: /Copiar código Pix/ }));

  expect(areaDeTransferencia.writeText).toHaveBeenCalledWith(COPIA_E_COLA);
  expect(await screen.findByRole("button", { name: /Código copiado/ })).toBeInTheDocument();
});

it("copia exatamente a linha digitável recebida", async () => {
  dadosMock.mockResolvedValue(dados);
  render(<ComoPagarFatura faturaId="fat_1" />);

  await userEvent.click(await screen.findByRole("button", { name: /Copiar linha digitável/ }));

  expect(areaDeTransferencia.writeText).toHaveBeenCalledWith(LINHA);
});

it("cobrança sem boleto ainda mostra o Pix", async () => {
  dadosMock.mockResolvedValue({ ...dados, boleto: null });
  render(<ComoPagarFatura faturaId="fat_1" />);

  expect(await screen.findByRole("button", { name: /Copiar código Pix/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Copiar linha digitável/ })).not.toBeInTheDocument();
});

it("sem Pix e sem boleto, aponta o link da fatura em vez de ficar em branco", async () => {
  dadosMock.mockResolvedValue({ ...dados, pix: null, boleto: null });
  render(<ComoPagarFatura faturaId="fat_1" />);

  expect(await screen.findByText(/não tem Pix nem boleto disponíveis/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Abrir a fatura/ })).toHaveAttribute("href", "https://asaas.test/i/1");
});

it("área de transferência bloqueada avisa, e o código segue visível na tela", async () => {
  dadosMock.mockResolvedValue(dados);
  areaDeTransferencia.writeText.mockRejectedValueOnce(new Error("bloqueado"));
  render(<ComoPagarFatura faturaId="fat_1" />);

  await userEvent.click(await screen.findByRole("button", { name: /Copiar código Pix/ }));

  await waitFor(() => expect(screen.getByText(/Selecione o código e copie/)).toBeInTheDocument());
  expect(screen.getByText(COPIA_E_COLA)).toBeInTheDocument();
});
