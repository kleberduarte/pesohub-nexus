import { devicesApi, setSessionScope, setCurrentUser, getCurrentUser, ApiError } from "../lib/api";

/**
 * O `request()` de `lib/api.ts` — as ~40 linhas que TODA chamada de API
 * atravessa (card #63).
 *
 * Concentra três comportamentos críticos que não tinham teste nenhum, e cujo
 * modo de falha é silencioso: continuar funcionando, só que errado.
 */
const HEADER_LOJA = "x-pesohub-loja";
const HEADER_CLIENTE = "x-pesohub-cliente";

const respostaOk = (corpo: unknown = {}) =>
  ({ ok: true, status: 200, text: async () => JSON.stringify(corpo) }) as Response;

const respostaErro = (status: number, message?: string) =>
  ({ ok: false, status, json: async () => (message ? { message } : {}) }) as Response;

const headersEnviados = () =>
  (global.fetch as jest.Mock).mock.calls[0][1].headers as Record<string, string>;

/**
 * `window.location` é não-configurável no jsdom, então navegamos de verdade com
 * `history.replaceState` em vez de substituir o objeto.
 *
 * A atribuição `location.href = "/login"` NÃO é observável aqui — o jsdom não
 * implementa navegação e não deixa interceptar a propriedade. Em compensação, o
 * `request()` só grava o motivo do encerramento DENTRO do mesmo bloco que
 * redireciona, então a presença desse motivo é prova fiel da decisão. É esse o
 * observável usado abaixo.
 */
function navegarPara(pathname: string) {
  window.history.replaceState({}, "", pathname);
}

const MOTIVO_KEY = "pesohub_session_end_reason";
const decidiuRedirecionar = () => sessionStorage.getItem(MOTIVO_KEY) !== null;

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
  global.fetch = jest.fn();
  navegarPara("/produtos");
});

describe("request — escopo por aba (card #48)", () => {
  // Se estes headers pararem de ser enviados, o usuário opera na loja errada
  // e sincroniza produto para as balanças erradas. Sem nenhum aviso.
  it("envia loja e empresa ativas nos headers", async () => {
    setSessionScope({ lojaId: "loja-1", clienteId: "cliente-1" } as never);
    (global.fetch as jest.Mock).mockResolvedValue(respostaOk({ data: [], total: 0 }));

    await devicesApi.list();

    expect(headersEnviados()[HEADER_LOJA]).toBe("loja-1");
    expect(headersEnviados()[HEADER_CLIENTE]).toBe("cliente-1");
  });

  it("não inventa headers quando não há escopo definido", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(respostaOk({ data: [], total: 0 }));

    await devicesApi.list();

    expect(headersEnviados()).not.toHaveProperty(HEADER_LOJA);
    expect(headersEnviados()).not.toHaveProperty(HEADER_CLIENTE);
  });

  it("manda o cookie de sessão junto", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(respostaOk({ data: [], total: 0 }));

    await devicesApi.list();

    expect((global.fetch as jest.Mock).mock.calls[0][1].credentials).toBe("include");
  });
});

describe("request — sessão expirada (401)", () => {
  it("limpa o usuário e decide redirecionar para o login", async () => {
    setCurrentUser({ sub: "u1" } as never);
    (global.fetch as jest.Mock).mockResolvedValue(respostaErro(401, "Sessão encerrada."));

    await expect(devicesApi.list()).rejects.toThrow(ApiError);

    expect(getCurrentUser()).toBeNull();
    expect(decidiuRedirecionar()).toBe(true);
  });

  // O comentário no código explica por quê: ser derrubado por um login em
  // outro dispositivo é a única pista de que alguém está usando a sua conta.
  // Sumir com a mensagem esconde o incidente que a sessão única revela.
  it("preserva o motivo do encerramento através do redirect", async () => {
    const motivo = "Sua sessão foi encerrada porque sua conta foi acessada em outro dispositivo.";
    (global.fetch as jest.Mock).mockResolvedValue(respostaErro(401, motivo));

    await expect(devicesApi.list()).rejects.toThrow(ApiError);

    expect(sessionStorage.getItem("pesohub_session_end_reason")).toBe(motivo);
  });

  // A exceção sutil: redirecionar aqui criaria laço na própria tela de login.
  it("não redireciona quando já está no login", async () => {
    navegarPara("/login");
    (global.fetch as jest.Mock).mockResolvedValue(respostaErro(401, "credenciais inválidas"));

    await expect(devicesApi.list()).rejects.toThrow(ApiError);

    expect(decidiuRedirecionar()).toBe(false);
  });

  // Link público de acesso espera 401 legitimamente enquanto não há sessão.
  it("não redireciona num link de acesso público", async () => {
    navegarPara("/acesso/token-123");
    (global.fetch as jest.Mock).mockResolvedValue(respostaErro(401));

    await expect(devicesApi.list()).rejects.toThrow(ApiError);

    expect(decidiuRedirecionar()).toBe(false);
  });
});

describe("request — erros em geral", () => {
  it("propaga a mensagem e o status do backend", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(respostaErro(409, "Número já em uso."));

    await expect(devicesApi.list()).rejects.toMatchObject({
      message: "Número já em uso.",
      status: 409,
    });
  });

  it("junta as mensagens quando o backend manda uma lista de validação", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: ["nome é obrigatório", "preço inválido"] }),
    } as Response);

    await expect(devicesApi.list()).rejects.toThrow("nome é obrigatório preço inválido");
  });

  it("não redireciona em erro que não seja 401", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(respostaErro(500, "erro interno"));

    await expect(devicesApi.list()).rejects.toThrow(ApiError);

    expect(decidiuRedirecionar()).toBe(false);
  });
});
