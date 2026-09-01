import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SyncPage from "../app/(dashboard)/sync/page";
import { devicesApi, syncApi } from "../lib/api";

/**
 * Tela de Sincronização — é onde os erros da balança chegam ao usuário.
 *
 * Estes testes existem por causa do card #56: a mensagem de erro estava
 * correta no banco e **invisível na tela**, escondida num atributo `title`.
 * Ninguém lia. Só apareceu quando alguém foi olhar com o navegador.
 *
 * Todo o trabalho dos cards #51/#54/#55/#59 foi produzir mensagens que dizem o
 * que fazer. Se elas voltarem a sumir daqui, esse trabalho vira nada — e é
 * exatamente o que estes testes impedem.
 */
jest.mock("../lib/api", () => ({
  devicesApi: { list: jest.fn() },
  syncApi: { status: jest.fn(), create: jest.fn() },
  ApiError: class ApiError extends Error {},
}));

const MOTIVO =
  'formato 1 ("TESTE DESCARTE") não foi gravado — o slot ainda contém "PF-1". ' +
  "A balança aceitou o envio e descartou em silêncio. Escolha outro número.";

const job = (over: Record<string, unknown> = {}) => ({
  id: "job-1",
  tipo: "INCREMENTAL",
  status: "ERROR",
  erro: MOTIVO,
  iniciadoEm: "2026-09-01T16:04:23.000Z",
  items: [],
  ...over,
});

function comHistorico(jobs: unknown[]) {
  (devicesApi.list as jest.Mock).mockResolvedValue({
    data: [{ id: "dev-1", nome: "Balança Teste" }],
  });
  (syncApi.status as jest.Mock).mockResolvedValue({ jobs });
}

describe("Tela de Sincronização — o motivo do erro chega ao usuário", () => {
  beforeEach(() => jest.clearAllMocks());

  // A regressão do card #56. Se este teste cair, a mensagem voltou a se esconder.
  it("mostra o motivo do erro como texto legível na tela", async () => {
    comHistorico([job()]);
    render(<SyncPage />);
    expect(await screen.findByText(MOTIVO)).toBeVisible();
  });

  // O card #56 também tirou a promessa falsa: não há retry que resolva um
  // slot de fábrica nem um pacote vazio.
  it("não promete retry automático", async () => {
    comHistorico([job()]);
    render(<SyncPage />);
    expect(await screen.findByText("Erro")).toBeInTheDocument();
    expect(screen.queryByText(/retry autom/i)).not.toBeInTheDocument();
  });

  it("não mostra bloco de erro em job concluído", async () => {
    comHistorico([job({ status: "SUCCESS", erro: null })]);
    render(<SyncPage />);
    expect(await screen.findByText("Concluído")).toBeInTheDocument();
    expect(screen.queryByText(MOTIVO)).not.toBeInTheDocument();
  });
});

describe("Tela de Sincronização — expandir e recolher (card #57)", () => {
  beforeEach(() => jest.clearAllMocks());

  const outro = "A sincronização incremental não casou nenhum produto.";

  // A decisão registrada no card #57: o caso comum é "deu errado, quero saber
  // por quê" — cobrar um clique justo aí seria atrito.
  it("já vem com o erro mais recente aberto", async () => {
    comHistorico([job(), job({ id: "job-2", erro: outro })]);
    render(<SyncPage />);
    expect(await screen.findByText(MOTIVO)).toBeVisible();
    expect(screen.queryByText(outro)).not.toBeInTheDocument();
  });

  it("abre o motivo de um erro antigo ao clicar na linha", async () => {
    comHistorico([job(), job({ id: "job-2", erro: outro })]);
    render(<SyncPage />);
    await screen.findByText(MOTIVO);

    const linhasAntigas = screen.getAllByRole("button", { expanded: false });
    await userEvent.click(linhasAntigas[0]);

    expect(await screen.findByText(outro)).toBeVisible();
  });

  it("recolhe ao clicar de novo", async () => {
    comHistorico([job()]);
    render(<SyncPage />);
    const linha = await screen.findByRole("button", { expanded: true });

    await userEvent.click(linha);

    expect(screen.queryByText(MOTIVO)).not.toBeInTheDocument();
  });
});
