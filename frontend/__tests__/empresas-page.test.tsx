import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmpresasPage from "../app/(dashboard)/empresas/page";
import { authApi, clientesApi } from "../lib/api";

/**
 * Tela de Empresas — 661 linhas e 22 estados, sem nenhum teste até aqui.
 *
 * Escritos SEM refatorar a tela (card #64). A evidência do dia é que os testes
 * acharam mais defeitos do que a refatoração: CSV corrompendo, labels
 * inacessíveis, listas mentindo. Nenhum foi achado movendo código.
 *
 * O foco é o comportamento delicado: trocar de empresa muda o contexto de TODO
 * o sistema, e fazer isso com alterações pendentes perde trabalho.
 */
jest.mock("../lib/api", () => ({
  clientesApi: { list: jest.fn(), create: jest.fn(), remove: jest.fn(), updateMe: jest.fn(), getMe: jest.fn() },
  authApi: { switchCompany: jest.fn() },
  getCurrentUser: () => ({ clienteId: "c-1", role: "SUPERADMIN" }),
  ApiError: class ApiError extends Error {},
}));

const empresa = (over = {}) => ({
  id: "c-1",
  nome: "Ramuza",
  isDefault: false,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  (clientesApi.list as jest.Mock).mockResolvedValue([
    empresa(),
    empresa({ id: "c-default", nome: "PesoHub", isDefault: true }),
  ]);
  (clientesApi.getMe as jest.Mock).mockResolvedValue({});
});

describe("Empresas — listagem", () => {
  it("lista as empresas cadastradas", async () => {
    render(<EmpresasPage />);

    expect(await screen.findByText("Ramuza")).toBeVisible();
    expect(screen.getByText("PesoHub")).toBeVisible();
  });

  it("mostra a mensagem do backend quando a listagem falha", async () => {
    const { ApiError } = jest.requireMock("../lib/api");
    (clientesApi.list as jest.Mock).mockRejectedValue(new ApiError("Sem permissão."));

    render(<EmpresasPage />);

    expect(await screen.findByText(/sem permissão/i)).toBeVisible();
  });
});

describe("Empresas — restaurar padrão", () => {
  /**
   * Semântica que já foi corrigida uma vez e não pode regredir: "restaurar"
   * TROCA O CONTEXTO de volta para a empresa padrão — não sobrescreve os dados
   * da empresa atual com os dela.
   *
   * Se alguém "consertar" isso para sobrescrever, o botão passa a destruir o
   * branding da empresa em que a pessoa está.
   */
  it("troca o contexto para a empresa padrão, sem alterar a empresa atual", async () => {
    (authApi.switchCompany as jest.Mock).mockResolvedValue({});
    render(<EmpresasPage />);
    await screen.findByText("Ramuza");

    await userEvent.click(screen.getByRole("button", { name: /restaurar \(voltar para padrão\)/i }));
    await userEvent.click(await screen.findByRole("button", { name: /^restaurar$/i }));

    await waitFor(() => expect(authApi.switchCompany).toHaveBeenCalledWith("c-default"));
    // O ponto do teste: restaurar NÃO grava nada na empresa atual.
    expect(clientesApi.updateMe).not.toHaveBeenCalled();
  });
});
