import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabelaNutricionalPanel } from "../components/cadastros/TabelaNutricionalPanel";
import { tabelasNutricionaisApi } from "../lib/api";

/**
 * Tabela Nutricional — 438 linhas, sem testes até aqui.
 *
 * O comportamento mais delicado é o campo de **selos**: texto separado por
 * vírgula que vira a faixa "ALTO EM ..." impressa na etiqueta. Não é cosmético
 * — é o Anexo XVIII da IN 75/2020 da ANVISA. Um selo perdido ou grudado ao
 * seguinte é uma etiqueta fora de conformidade.
 */
jest.mock("../lib/api", () => ({
  tabelasNutricionaisApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
  ApiError: class ApiError extends Error {},
}));

const abrirNova = async () => {
  render(<TabelaNutricionalPanel />);
  await userEvent.click(await screen.findByRole("button", { name: /^novo$/i }));
};

const preencherBasico = async () => {
  await userEvent.clear(screen.getByLabelText(/número/i));
  await userEvent.type(screen.getByLabelText(/número/i), "40");
  await userEvent.type(screen.getByLabelText(/^nome/i), "IOGURTE");
};

const salvar = () => userEvent.click(screen.getByRole("button", { name: /^salvar$/i }));
const payloadEnviado = () => (tabelasNutricionaisApi.create as jest.Mock).mock.calls[0][0];

beforeEach(() => {
  jest.clearAllMocks();
  (tabelasNutricionaisApi.list as jest.Mock).mockResolvedValue([]);
  (tabelasNutricionaisApi.create as jest.Mock).mockResolvedValue({});
});

describe("Tabela Nutricional — selos ANVISA", () => {
  it("separa os selos por vírgula, sem espaços sobrando", async () => {
    await abrirNova();
    await preencherBasico();
    await userEvent.type(screen.getByLabelText(/selos/i), "AÇÚCAR ADICIONADO, GORDURA SATURADA");

    await salvar();

    await waitFor(() => expect(tabelasNutricionaisApi.create).toHaveBeenCalled());
    expect(payloadEnviado().selos).toEqual(["AÇÚCAR ADICIONADO", "GORDURA SATURADA"]);
  });

  // Uma vírgula sobrando não pode virar um selo em branco: a faixa impressa
  // ganharia um espaço vazio no meio.
  it("descarta entradas vazias entre vírgulas", async () => {
    await abrirNova();
    await preencherBasico();
    await userEvent.type(screen.getByLabelText(/selos/i), "SÓDIO,, ,GORDURA");

    await salvar();

    await waitFor(() => expect(tabelasNutricionaisApi.create).toHaveBeenCalled());
    expect(payloadEnviado().selos).toEqual(["SÓDIO", "GORDURA"]);
  });

  it("envia lista vazia quando não há selos, em vez de [\"\"]", async () => {
    await abrirNova();
    await preencherBasico();

    await salvar();

    await waitFor(() => expect(tabelasNutricionaisApi.create).toHaveBeenCalled());
    expect(payloadEnviado().selos).toEqual([]);
  });
});

describe("Tabela Nutricional — salvar", () => {
  it("mostra a mensagem do backend sem fechar o formulário", async () => {
    const { ApiError } = jest.requireMock("../lib/api");
    (tabelasNutricionaisApi.create as jest.Mock).mockRejectedValue(new ApiError("Número já em uso."));

    await abrirNova();
    await preencherBasico();
    await salvar();

    expect(await screen.findByText(/número já em uso/i)).toBeVisible();
    expect(screen.getByLabelText(/^nome/i)).toBeInTheDocument();
  });
});
