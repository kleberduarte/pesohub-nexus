import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsuariosPage from "../app/(dashboard)/usuarios/page";
import { clientesApi, lojasApi, usersApi } from "../lib/api";

/**
 * Tela de Usuários — 466 linhas, 21 estados, sem testes até aqui.
 *
 * O foco é o que decide ACESSO. Errar aqui não quebra a tela: dá acesso demais
 * ou de menos a uma pessoa, silenciosamente.
 */
let mockUsuarioAtual: { clienteId: string; role: string; email: string } = {
  clienteId: "c-1",
  role: "ADMIN",
  email: "admin@ramuza.com.br",
};

jest.mock("../lib/api", () => ({
  usersApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(), desbloquear: jest.fn() },
  lojasApi: { list: jest.fn() },
  clientesApi: { getMe: jest.fn() },
  getCurrentUser: () => mockUsuarioAtual,
  // Reproduz a lógica real em vez de devolver um valor fixo: um `false`
  // constante esconderia o teste de desbloqueio, que depende de a conta
  // aparecer como bloqueada.
  contaBloqueada: (u: { lockedUntil?: string | null }) =>
    !!u.lockedUntil && new Date(u.lockedUntil) > new Date(),
  ApiError: class ApiError extends Error {},
}));

const usuario = (over = {}) => ({
  id: "u-1",
  email: "operador@ramuza.com.br",
  role: "OPERADOR",
  lojaId: "loja-1",
  lockedUntil: null,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUsuarioAtual = { clienteId: "c-1", role: "ADMIN", email: "admin@ramuza.com.br" };
  (usersApi.list as jest.Mock).mockResolvedValue([usuario()]);
  (lojasApi.list as jest.Mock).mockResolvedValue([{ id: "loja-1", nome: "Loja Matriz" }]);
  (clientesApi.getMe as jest.Mock).mockResolvedValue({ isDefault: false, dominio: "ramuza.com.br" });
  (usersApi.create as jest.Mock).mockResolvedValue({});
});

// O formulário fica num painel aberto por "Novo usuário"; convite é o padrão
// (card #91), então estes testes escolhem "Definir senha" explicitamente.
const preencherNovoUsuario = async (email: string, senha: string) => {
  await userEvent.click(screen.getByRole("button", { name: /novo usuário/i }));
  await userEvent.click(screen.getByRole("button", { name: /definir senha/i }));
  await userEvent.type(screen.getByLabelText(/e-mail/i), email);
  await userEvent.type(screen.getByLabelText(/^senha$/i), senha);
};

describe("Usuários — escopo de acesso por papel", () => {
  /**
   * OPERADOR e VIEWER ficam restritos a uma loja; ADMIN enxerga todas.
   *
   * A regra vive num array solto (`ROLES_RESTRINGIVEIS_A_LOJA`). Se alguém
   * mexer nele sem perceber, um OPERADOR passa a ver todas as lojas — e o
   * defeito é invisível: a tela continua funcionando.
   */
  it("envia a loja escolhida quando o papel é OPERADOR", async () => {
    render(<UsuariosPage />);
    await screen.findByText("operador@ramuza.com.br");

    await preencherNovoUsuario("novo@ramuza.com.br", "Senha!Forte1");
    await userEvent.selectOptions(screen.getAllByLabelText(/perfil/i)[0], "OPERADOR");
    await userEvent.selectOptions(screen.getByLabelText(/loja/i), "loja-1");
    await userEvent.click(screen.getByRole("button", { name: /^cadastrar$/i }));

    await waitFor(() => expect(usersApi.create).toHaveBeenCalled());
    expect((usersApi.create as jest.Mock).mock.calls[0][0]).toMatchObject({
      role: "OPERADOR",
      lojaId: "loja-1",
    });
  });

  it("não envia loja quando o papel é ADMIN", async () => {
    render(<UsuariosPage />);
    await screen.findByText("operador@ramuza.com.br");

    await preencherNovoUsuario("admin2@ramuza.com.br", "Senha!Forte1");
    await userEvent.selectOptions(screen.getAllByLabelText(/perfil/i)[0], "ADMIN");
    await userEvent.click(screen.getByRole("button", { name: /^cadastrar$/i }));

    await waitFor(() => expect(usersApi.create).toHaveBeenCalled());
    expect((usersApi.create as jest.Mock).mock.calls[0][0]).not.toHaveProperty("lojaId");
  });
});

describe("Usuários — funcionário de supermercado (card #96)", () => {
  // Um e-mail @davo.com.br nunca pode virar Administrador da empresa nem ver
  // loja de outra rede. O backend recusa; a tela nem oferece.
  it("e-mail de rede só oferece perfis de loja e só as lojas da rede", async () => {
    (lojasApi.list as jest.Mock).mockResolvedValue([
      { id: "davo-1", nome: "Davo Mooca", dominioEmail: "davo.com.br" },
      { id: "davo-2", nome: "Davo Tatuapé", dominioEmail: "davo.com.br" },
      { id: "avo-1", nome: "Rede Avó Centro", dominioEmail: "redeavo.com.br" },
    ]);
    render(<UsuariosPage />);
    await screen.findByText("operador@ramuza.com.br");

    await userEvent.click(screen.getByRole("button", { name: /novo usuário/i }));
    await userEvent.type(screen.getByLabelText(/e-mail/i), "joao@davo.com.br");

    const perfis = [...(screen.getAllByLabelText(/perfil/i)[0] as HTMLSelectElement).options].map((o) => o.value);
    expect(perfis).toEqual(["ADMIN_REDE", "OPERADOR", "VIEWER"]);
    const lojas = [...(screen.getByLabelText(/loja/i) as HTMLSelectElement).options].map((o) => o.value);
    expect(lojas).toEqual(["", "davo-1", "davo-2"]);
    expect(screen.getByText(/as 2 lojas dessa rede/)).toBeInTheDocument();
  });
});

describe("Usuários — Administrador da loja (card #96)", () => {
  it("abre a tela e só oferece perfis de loja, sem Administrador da empresa", async () => {
    mockUsuarioAtual = { clienteId: "c-1", role: "ADMIN_REDE", email: "gerente@davo.com.br" };
    (lojasApi.list as jest.Mock).mockResolvedValue([{ id: "davo-1", nome: "Davo Mooca", dominioEmail: "davo.com.br" }]);
    render(<UsuariosPage />);
    await screen.findByText("operador@ramuza.com.br");

    await userEvent.click(screen.getByRole("button", { name: /novo usuário/i }));
    expect(screen.getByText("Precisa ser um e-mail @davo.com.br")).toBeInTheDocument();
    const perfis = [...(screen.getAllByLabelText(/perfil/i)[0] as HTMLSelectElement).options].map((o) => o.value);
    expect(perfis).not.toContain("ADMIN");
  });
});

describe("Usuários — conta bloqueada (card #48)", () => {
  // Desbloquear NÃO redefine a senha: são ações distintas, e confundi-las
  // faria a pessoa perder a senha por ter errado 5 vezes.
  it("desbloqueia a conta sem tocar na senha", async () => {
    (usersApi.desbloquear as jest.Mock).mockResolvedValue({});
    (usersApi.list as jest.Mock).mockResolvedValue([
      usuario({ lockedUntil: new Date(Date.now() + 900_000).toISOString() }),
    ]);

    render(<UsuariosPage />);
    await userEvent.click(await screen.findByRole("button", { name: /desbloquear/i }));

    await waitFor(() => expect(usersApi.desbloquear).toHaveBeenCalledWith("u-1"));
    expect(usersApi.update).not.toHaveBeenCalled();
  });
});
