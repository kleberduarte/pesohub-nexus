const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const TOKEN_KEY = "pesohub_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    throw new ApiError(message ?? `Erro ${res.status} ao chamar ${path}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------- Auth ----------
export interface LoginResponse {
  accessToken: string;
}

export function login(email: string, senha: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

export type UserRole = "SUPERADMIN" | "ADMIN" | "OPERADOR" | "VIEWER";

export interface DecodedUser {
  sub: string;
  email: string;
  role: UserRole;
  clienteId: string | null;
}

export function decodeToken(token: string | null): DecodedUser | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json as DecodedUser;
  } catch {
    return null;
  }
}

export function getCurrentUser(): DecodedUser | null {
  return decodeToken(getToken());
}

export const authApi = {
  switchCompany: async (clienteId: string) => {
    const data = await request<LoginResponse>("/auth/switch-company", {
      method: "POST",
      body: JSON.stringify({ clienteId }),
    });
    setToken(data.accessToken);
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

export interface DiscoveredDevice {
  ip: string;
  port: number;
}

export const devicesApi = {
  list: () => request<Device[]>("/devices"),
  create: (data: CreateDeviceInput) =>
    request<Device>("/devices", { method: "POST", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/devices/${id}`, { method: "DELETE" }),
  discover: () => request<DiscoveredDevice[]>("/devices/discovered"),
};

// ---------- Products ----------
export interface Product {
  id: string;
  codigo: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  categoriaImposto?: string | null;
  ativo: boolean;
  versao: number;
}

export interface CreateProductInput {
  codigo: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  categoriaImposto?: string;
  ativo?: boolean;
}

export const productsApi = {
  list: () => request<Product[]>("/products"),
  create: (data: CreateProductInput) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/products/${id}`, { method: "DELETE" }),
};

// ---------- Clientes (tenant branding) ----------
export interface ClienteBranding {
  id: string;
  nome: string;
  logoUrl?: string | null;
  corPrimaria?: string | null;
  corSecundaria?: string | null;
  tagline?: string | null;
}

export interface ClienteParametros extends ClienteBranding {
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

export const usersApi = {
  list: () => request<AppUser[]>("/users"),
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

export const syncApi = {
  create: (data: CreateSyncJobInput) =>
    request<SyncJobQueuedResponse>("/sync", { method: "POST", body: JSON.stringify(data) }),
  status: (deviceId: string) => request<{ deviceId: string; jobs: unknown[] }>(`/sync/${deviceId}`),
};
