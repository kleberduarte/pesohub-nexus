const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const TOKEN_KEY = "ramuza_token";

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
    throw new ApiError(body.message ?? `Erro ${res.status} ao chamar ${path}`, res.status);
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

export const devicesApi = {
  list: () => request<Device[]>("/devices"),
  create: (data: CreateDeviceInput) =>
    request<Device>("/devices", { method: "POST", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/devices/${id}`, { method: "DELETE" }),
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
