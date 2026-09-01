import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormatoImpressaoPanel } from "../components/cadastros/FormatoImpressaoPanel";
import { devicesApi, formatosImpressaoApi } from "../lib/api";

/**
 * Cadastro de Formato de Impressão — o aviso de slot ocupado (cards #55/#59).
 *
 * Sem ele, a pessoa digita um número de 1 a 99 no escuro. Cair num slot
 * ocupado por modelo de fábrica faz a balança aceitar e descartar em silêncio,
 * e a etiqueta sai com o layout errado — foi assim que uma etiqueta em produção
 * saiu sem tabela nutricional.
 */
jest.mock("../lib/api", () => ({
  formatosImpressaoApi: { list: jest.fn(), create: jest.fn(), update: jest.fn() },
  devicesApi: { slotsEtiqueta: jest.fn() },
  productsApi: { listForPicker: jest.fn().mockResolvedValue([]) },
  imagensApi: { list: jest.fn().mockResolvedValue([]) },
  tabelasNutricionaisApi: { list: jest.fn().mockResolvedValue([]) },
  ApiError: class ApiError extends Error {},
}));

const abrirNovo = async () => {
  render(<FormatoImpressaoPanel />);
  await userEvent.click(await screen.findByRole("button", { name: /novo/i }));
};

beforeEach(() => {
  jest.clearAllMocks();
  (formatosImpressaoApi.list as jest.Mock).mockResolvedValue([]);
});

describe("Formato de Impressão — mapa de slots da balança", () => {
  it("sugere o primeiro número sem uso conhecido ao criar", async () => {
    (devicesApi.slotsEtiqueta as jest.Mock).mockResolvedValue({
      slots: [{ numero: 1, nome: "PF-1", deviceId: "d1", deviceNome: "Balança", lidosEm: "" }],
      livres: [15, 16, 17],
    });

    await abrirNovo();

    expect(await screen.findByLabelText(/número/i)).toHaveValue(15);
  });

  // A regressão que este teste trava: o slot 1 é "PF-1" de fábrica e foi
  // exatamente o que quebrou a etiqueta em produção.
  it("avisa quando o número escolhido já está ocupado, dizendo onde e por quê", async () => {
    (devicesApi.slotsEtiqueta as jest.Mock).mockResolvedValue({
      slots: [{ numero: 1, nome: "PF-1", deviceId: "d1", deviceNome: "Balança Loja", lidosEm: "" }],
      livres: [15],
    });

    await abrirNovo();
    const campo = await screen.findByLabelText(/número/i);
    await userEvent.clear(campo);
    await userEvent.type(campo, "1");

    expect(await screen.findByText(/já está ocupado/i)).toBeVisible();
    expect(screen.getByText(/Balança Loja/)).toBeInTheDocument();
    expect(screen.getByText(/descarta em silêncio/i)).toBeInTheDocument();
  });

  // Card #59: leitura que falha não é "nada ocupado". A tela precisa admitir
  // que não sabe, em vez de deixar a pessoa achar que está tudo livre.
  it("avisa que não conseguiu ler os slots quando o mapa não veio", async () => {
    (devicesApi.slotsEtiqueta as jest.Mock).mockRejectedValue(new Error("offline"));

    await abrirNovo();

    expect(await screen.findByText(/não foi possível ler os números/i)).toBeVisible();
  });
});
