const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

// A credencial de sessão em si vive só num cookie httpOnly setado pelo backend
// (não acessível a JS, protege contra roubo de sessão via XSS). Este cache
// guarda apenas os claims não sensíveis do usuário (role/email/clienteId) para
// gating de UI síncrono — não serve como credencial de autenticação.
const USER_CACHE_KEY = "pesohub_user";
// Empresa ativa persistida separadamente da sessão, para a tela de login
// continuar mostrando a identidade visual correta após o logout (que
// só derruba o USER_CACHE_KEY). Ver ClienteBranding.accessToken.
const ACTIVE_CLIENTE_TOKEN_KEY = "pesohub_active_cliente_token";

export function getCurrentUser(): DecodedUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DecodedUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: DecodedUser) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_CACHE_KEY);
}

export function getActiveClienteToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CLIENTE_TOKEN_KEY);
}

export function setActiveClienteToken(token: string) {
  localStorage.setItem(ACTIVE_CLIENTE_TOKEN_KEY, token);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;

    // Sessão ausente/expirada: manda pro login em vez de deixar a página
    // renderizada quebrada (sem empresa, sem usuário). Não redireciona se já
    // estamos no /login ou num link público de acesso (/acesso/:token), que
    // esperam 401 legitimamente quando não há sessão ainda.
    if (res.status === 401 && typeof window !== "undefined") {
      clearCurrentUser();
      const { pathname } = window.location;
      if (pathname !== "/login" && !pathname.startsWith("/acesso/")) {
        window.location.href = "/login";
      }
    }

    throw new ApiError(message ?? `Erro ${res.status} ao chamar ${path}`, res.status);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ---------- Auth ----------
export type UserRole = "SUPERADMIN" | "ADMIN" | "OPERADOR" | "VIEWER";

export interface DecodedUser {
  sub: string;
  email: string;
  role: UserRole;
  clienteId: string | null;
}

export interface LoginResponse {
  user: DecodedUser;
}

export async function login(email: string, senha: string) {
  const data = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
  setCurrentUser(data.user);
  return data;
}

export const authApi = {
  me: () => request<DecodedUser>("/auth/me"),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  switchCompany: async (clienteId: string) => {
    const data = await request<LoginResponse>("/auth/switch-company", {
      method: "POST",
      body: JSON.stringify({ clienteId }),
    });
    setCurrentUser(data.user);
    return data;
  },
};

// ---------- Devices ----------
export type DeviceStatus = "ONLINE" | "OFFLINE" | "NOT_CONFIGURED";

export interface Device {
  id: string;
  nome: string;
  ip: string;
  porta: number;
  grupoId?: string | null;
  status: DeviceStatus;
  ultimoAcesso?: string | null;
  agentId?: string | null;
}

export interface CreateDeviceInput {
  nome: string;
  ip: string;
  porta: number;
  grupoId?: string;
}

export type UpdateDeviceInput = Partial<CreateDeviceInput>;

export interface DiscoveredDevice {
  ip: string;
  port: number;
}

export const devicesApi = {
  list: () => request<Device[]>("/devices"),
  create: (data: CreateDeviceInput) =>
    request<Device>("/devices", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateDeviceInput) =>
    request<Device>(`/devices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/devices/${id}`, { method: "DELETE" }),
  discover: () => request<DiscoveredDevice[]>("/devices/discovered"),
  linkAgent: (id: string, agentToken: string) =>
    request<Device>(`/devices/${id}/link-agent`, { method: "POST", body: JSON.stringify({ agentToken }) }),
};

// ---------- Agents (Agent Local) ----------
export interface Agent {
  id: string;
  lojaId: string;
  versao: string;
  ultimoHeartbeat?: string | null;
  createdAt: string;
}

export interface CreatedAgent extends Agent {
  token: string;
}

export const agentsApi = {
  list: () => request<Agent[]>("/agents"),
  create: (lojaId: string) => request<CreatedAgent>("/agents", { method: "POST", body: JSON.stringify({ lojaId }) }),
};

// ---------- Products ----------
export type UnidadeVenda = "PESO" | "PECA";

export interface Product {
  id: string;
  codigo: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  categoriaImposto?: string | null;
  ativo: boolean;
  versao: number;

  lote?: string | null;
  unidadeVenda: UnidadeVenda;
  tara?: number | null;
  taraPorCento: boolean;
  pesoFixo: boolean;
  desconto?: number | null;
  modoEspecial: number;

  subSetorId?: string | null;
  tabelaNutricionalId?: string | null;
  fornecedorId?: string | null;
  alergicoId?: string | null;
  imagemId?: string | null;
  formatoImpressaoId?: string | null;
  codigoBarrasFormatoId?: string | null;
  bandeiraCodigoBarras?: number | null;

  textoExtra1?: string | null;
  textoExtra2?: string | null;
  textoExtra3?: string | null;
  textoExtra4?: string | null;
  textoExtra5?: string | null;
  textoExtra6?: string | null;
  textoExtra7?: string | null;

  diasDeVenda?: number | null;
  tempoDeVenda?: number | null;
  validadePacote?: number | null;
  validadePacoteHoras?: number | null;
  validadeDias?: number | null;
}

export interface CreateProductInput {
  codigo: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  categoriaImposto?: string;
  ativo?: boolean;

  lote?: string;
  unidadeVenda?: UnidadeVenda;
  tara?: number;
  taraPorCento?: boolean;
  pesoFixo?: boolean;
  desconto?: number;
  modoEspecial?: number;

  subSetorId?: string;
  tabelaNutricionalId?: string;
  fornecedorId?: string;
  alergicoId?: string;
  imagemId?: string;
  formatoImpressaoId?: string;
  codigoBarrasFormatoId?: string;
  bandeiraCodigoBarras?: number;

  textoExtra1?: string;
  textoExtra2?: string;
  textoExtra3?: string;
  textoExtra4?: string;
  textoExtra5?: string;
  textoExtra6?: string;
  textoExtra7?: string;

  diasDeVenda?: number;
  tempoDeVenda?: number;
  validadePacote?: number;
  validadePacoteHoras?: number;
  validadeDias?: number;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export const productsApi = {
  list: () => request<Product[]>("/products"),
  create: (data: CreateProductInput) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateProductInput) =>
    request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/products/${id}`, { method: "DELETE" }),
  removeAll: () => request<{ deleted: number }>("/products", { method: "DELETE" }),
};

// ---------- Setores ----------
export interface Setor {
  id: string;
  numero: number;
  nome: string;
}

export type CreateSetorInput = Omit<Setor, "id">;
export type UpdateSetorInput = Partial<CreateSetorInput>;

export const setoresApi = {
  list: () => request<Setor[]>("/setores"),
  create: (data: CreateSetorInput) => request<Setor>("/setores", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateSetorInput) =>
    request<Setor>(`/setores/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/setores/${id}`, { method: "DELETE" }),
};

// ---------- Sub-Setores ----------
export interface SubSetor {
  id: string;
  numero: number;
  nome: string;
  setorId: string;
  formatoImpressaoId?: string | null;
  codigoBarrasFormatoId?: string | null;
  bandeiraCodigoBarras?: number | null;
}

export type CreateSubSetorInput = Omit<SubSetor, "id">;
export type UpdateSubSetorInput = Partial<CreateSubSetorInput>;

export const subSetoresApi = {
  list: () => request<SubSetor[]>("/sub-setores"),
  create: (data: CreateSubSetorInput) =>
    request<SubSetor>("/sub-setores", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateSubSetorInput) =>
    request<SubSetor>(`/sub-setores/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/sub-setores/${id}`, { method: "DELETE" }),
};

// ---------- Fornecedores ----------
export interface Fornecedor {
  id: string;
  numero: number;
  nome: string;
  informacao?: string | null;
}

export type CreateFornecedorInput = Omit<Fornecedor, "id">;
export type UpdateFornecedorInput = Partial<CreateFornecedorInput>;

export const fornecedoresApi = {
  list: () => request<Fornecedor[]>("/fornecedores"),
  create: (data: CreateFornecedorInput) =>
    request<Fornecedor>("/fornecedores", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateFornecedorInput) =>
    request<Fornecedor>(`/fornecedores/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/fornecedores/${id}`, { method: "DELETE" }),
};

// ---------- Alérgicos ----------
export interface Alergico {
  id: string;
  numero: number;
  nome: string;
  informacao?: string | null;
}

export type CreateAlergicoInput = Omit<Alergico, "id">;
export type UpdateAlergicoInput = Partial<CreateAlergicoInput>;

export const alergicosApi = {
  list: () => request<Alergico[]>("/alergicos"),
  create: (data: CreateAlergicoInput) =>
    request<Alergico>("/alergicos", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateAlergicoInput) =>
    request<Alergico>(`/alergicos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/alergicos/${id}`, { method: "DELETE" }),
};

// ---------- Tabelas Nutricionais ----------
export type NutrienteUnidade = "KCAL_KJ" | "G" | "MG" | "MCG";

export interface TabelaNutricionalItem {
  ordem: number;
  ingrediente: string;
  unidade: NutrienteUnidade;
  valor: number;
  porcentagem: number;
}

export interface TabelaNutricional {
  id: string;
  numero: number;
  nome: string;
  porcao?: string | null;
  itens: TabelaNutricionalItem[];
}

export type CreateTabelaNutricionalInput = Omit<TabelaNutricional, "id">;
export type UpdateTabelaNutricionalInput = Partial<CreateTabelaNutricionalInput>;

export const tabelasNutricionaisApi = {
  list: () => request<TabelaNutricional[]>("/tabelas-nutricionais"),
  create: (data: CreateTabelaNutricionalInput) =>
    request<TabelaNutricional>("/tabelas-nutricionais", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateTabelaNutricionalInput) =>
    request<TabelaNutricional>(`/tabelas-nutricionais/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/tabelas-nutricionais/${id}`, { method: "DELETE" }),
};

// ---------- Operadores ----------
export interface Operador {
  id: string;
  numero: number;
  nome: string;
  codigo?: string | null;
  permissoes?: Record<string, boolean> | null;
}

export interface CreateOperadorInput {
  numero: number;
  nome: string;
  senha: string;
  codigo?: string;
  permissoes?: Record<string, boolean>;
}

export type UpdateOperadorInput = Partial<CreateOperadorInput>;

export const operadoresApi = {
  list: () => request<Operador[]>("/operadores"),
  create: (data: CreateOperadorInput) =>
    request<Operador>("/operadores", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateOperadorInput) =>
    request<Operador>(`/operadores/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/operadores/${id}`, { method: "DELETE" }),
};

// ---------- Imagens ----------
export interface Imagem {
  id: string;
  nome: string;
  url: string;
  larguraMm?: number | null;
  alturaMm?: number | null;
}

export type CreateImagemInput = Omit<Imagem, "id">;
export type UpdateImagemInput = Partial<CreateImagemInput>;

export const imagensApi = {
  list: () => request<Imagem[]>("/imagens"),
  create: (data: CreateImagemInput) => request<Imagem>("/imagens", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateImagemInput) =>
    request<Imagem>(`/imagens/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/imagens/${id}`, { method: "DELETE" }),
};

// ---------- Formatos de Impressão ----------
export interface FormatoImpressao {
  id: string;
  numero: number;
  nome: string;
  tipo: number;
  larguraMm: number;
  alturaMm: number;
  layout?: Record<string, unknown> | null;
}

export type CreateFormatoImpressaoInput = Omit<FormatoImpressao, "id">;
export type UpdateFormatoImpressaoInput = Partial<CreateFormatoImpressaoInput>;

export const formatosImpressaoApi = {
  list: () => request<FormatoImpressao[]>("/formatos-impressao"),
  create: (data: CreateFormatoImpressaoInput) =>
    request<FormatoImpressao>("/formatos-impressao", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateFormatoImpressaoInput) =>
    request<FormatoImpressao>(`/formatos-impressao/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/formatos-impressao/${id}`, { method: "DELETE" }),
};

// ---------- Códigos de Barras (formatos customizados) ----------
export type CodigoBarrasTipo = "EAN13" | "EAN128";

export interface CodigoBarrasFormato {
  id: string;
  numero: number;
  nome: string;
  tipo: CodigoBarrasTipo;
  verificador: number;
  constante1?: number | null;
  constante2?: number | null;
  detalhes?: Record<string, unknown> | null;
}

export type CreateCodigoBarrasFormatoInput = Omit<CodigoBarrasFormato, "id">;
export type UpdateCodigoBarrasFormatoInput = Partial<CreateCodigoBarrasFormatoInput>;

export const codigosBarrasFormatoApi = {
  list: () => request<CodigoBarrasFormato[]>("/codigos-barras-formato"),
  create: (data: CreateCodigoBarrasFormatoInput) =>
    request<CodigoBarrasFormato>("/codigos-barras-formato", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateCodigoBarrasFormatoInput) =>
    request<CodigoBarrasFormato>(`/codigos-barras-formato/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/codigos-barras-formato/${id}`, { method: "DELETE" }),
};

// ---------- Textos Globais ----------
export interface TextoGlobal {
  id: string;
  indice: number;
  texto: string;
}

export type CreateTextoGlobalInput = Omit<TextoGlobal, "id">;
export type UpdateTextoGlobalInput = Partial<CreateTextoGlobalInput>;

export const textosGlobaisApi = {
  list: () => request<TextoGlobal[]>("/textos-globais"),
  create: (data: CreateTextoGlobalInput) =>
    request<TextoGlobal>("/textos-globais", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateTextoGlobalInput) =>
    request<TextoGlobal>(`/textos-globais/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/textos-globais/${id}`, { method: "DELETE" }),
};

// ---------- Teclas de Acesso Rápido ----------
export interface TeclaAcessoRapido {
  id: string;
  nome: string;
  modelo: string;
  pagina: string;
  layout?: Record<string, unknown> | null;
}

export type CreateTeclaAcessoRapidoInput = Omit<TeclaAcessoRapido, "id">;
export type UpdateTeclaAcessoRapidoInput = Partial<CreateTeclaAcessoRapidoInput>;

export const teclasAcessoRapidoApi = {
  list: () => request<TeclaAcessoRapido[]>("/teclas-acesso-rapido"),
  create: (data: CreateTeclaAcessoRapidoInput) =>
    request<TeclaAcessoRapido>("/teclas-acesso-rapido", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateTeclaAcessoRapidoInput) =>
    request<TeclaAcessoRapido>(`/teclas-acesso-rapido/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/teclas-acesso-rapido/${id}`, { method: "DELETE" }),
};

// ---------- SPEC (parâmetros da balança) ----------
export interface SpecParametro {
  id: string;
  numero: number;
  valor: string;
}

export const specParametrosApi = {
  list: () => request<SpecParametro[]>("/spec-parametros"),
  upsert: (numero: number, valor: string) =>
    request<SpecParametro>("/spec-parametros", { method: "PUT", body: JSON.stringify({ numero, valor }) }),
};

// ---------- Configurações Avançadas ----------
export interface ConfiguracaoAvancada {
  id: string;
  menusHabilitados?: Record<string, boolean> | null;
  funcaoPluPermitir?: Record<string, boolean> | null;
  fonteExibicao?: string | null;
  formatoDataHora?: string | null;
  excluirRegistrosDias?: number | null;
  importacaoPluCampos?: Record<string, boolean> | null;
}

export type UpsertConfiguracaoAvancadaInput = Partial<Omit<ConfiguracaoAvancada, "id">>;

export const configuracaoAvancadaApi = {
  get: () => request<ConfiguracaoAvancada | null>("/configuracao-avancada"),
  upsert: (data: UpsertConfiguracaoAvancadaInput) =>
    request<ConfiguracaoAvancada>("/configuracao-avancada", { method: "PUT", body: JSON.stringify(data) }),
};

// ---------- Clientes (tenant branding) ----------
export interface ClienteBranding {
  id: string;
  nome: string;
  logoUrl?: string | null;
  corPrimaria?: string | null;
  corSecundaria?: string | null;
  tagline?: string | null;
  accessToken?: string;
}

export interface ClienteParametros extends ClienteBranding {
  accessToken: string;
  corFundo?: string | null;
  corTexto?: string | null;
  corBotao?: string | null;
  corBotaoTexto?: string | null;
  chavePix?: string | null;
  suporteEmail?: string | null;
  suporteWhatsapp?: string | null;
  isDefault: boolean;
}

export interface UpdateClienteParametrosInput {
  nome: string;
  logoUrl?: string;
  tagline?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  corFundo?: string;
  corTexto?: string;
  corBotao?: string;
  corBotaoTexto?: string;
  chavePix?: string;
  suporteEmail?: string;
  suporteWhatsapp?: string;
}

export const clientesApi = {
  branding: () => request<ClienteBranding>("/clientes/me/branding"),
  publicAccess: (token: string) => request<ClienteBranding>(`/clientes/acesso/${token}`),
  list: () => request<ClienteParametros[]>("/clientes"),
  create: (nome: string) => request<ClienteParametros>("/clientes", { method: "POST", body: JSON.stringify({ nome }) }),
  remove: (id: string) => request<void>(`/clientes/${id}`, { method: "DELETE" }),
  getMe: () => request<ClienteParametros>("/clientes/me"),
  getDefault: () => request<ClienteParametros>("/clientes/default"),
  updateMe: (data: UpdateClienteParametrosInput) =>
    request<ClienteParametros>("/clientes/me", { method: "PATCH", body: JSON.stringify(data) }),
};

// ---------- Users ----------
export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  senha: string;
  role: UserRole;
}

export interface UpdateUserInput {
  role?: UserRole;
  senha?: string;
}

export const usersApi = {
  list: () => request<AppUser[]>("/users"),
  create: (data: CreateUserInput) => request<AppUser>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateUserInput) =>
    request<AppUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/users/${id}`, { method: "DELETE" }),
};

// ---------- Sync ----------
export interface CreateSyncJobInput {
  deviceIds: string[];
  tipo: "TOTAL" | "INCREMENTAL";
  productIds?: string[];
}

export interface SyncJobQueuedResponse {
  queued: string[];
}

export type SyncJobStatus = "PENDING" | "IN_PROGRESS" | "SUCCESS" | "ERROR";

export interface SyncJobItem {
  id: string;
  productId: string;
  acao: "CREATE" | "UPDATE" | "DELETE";
  status: SyncJobStatus;
  product: { nome: string; codigo: string };
}

export interface SyncJob {
  id: string;
  deviceId: string;
  status: SyncJobStatus;
  tipo: "TOTAL" | "INCREMENTAL";
  iniciadoEm: string | null;
  concluidoEm: string | null;
  erro: string | null;
  items: SyncJobItem[];
}

export const syncApi = {
  create: (data: CreateSyncJobInput) =>
    request<SyncJobQueuedResponse>("/sync", { method: "POST", body: JSON.stringify(data) }),
  status: (deviceId: string) => request<{ deviceId: string; jobs: SyncJob[] }>(`/sync/${deviceId}`),
};
