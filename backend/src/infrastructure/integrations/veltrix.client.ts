import { InternalServerErrorException, UnauthorizedException } from "@nestjs/common";

export interface VeltrixProduct {
  id: number;
  name: string;
  codigoProduto: string | null;
  gtinEan: string | null;
  price: number | null;
  precoEfetivo: number | null;
  active: boolean | null;
}

interface VeltrixAuthResponse {
  token: string;
}

/**
 * Cliente HTTP para o ERP Veltrix (`C:\Projetos\veltrix`, Spring Boot).
 * Não existe API key nem webhook lá — a única forma de autenticar
 * server-to-server hoje é logar com um usuário de serviço e usar o JWT.
 */
export class VeltrixClient {
  constructor(
    private readonly baseUrl: string,
    private readonly email: string,
    private readonly senha: string,
  ) {}

  async listProducts(): Promise<VeltrixProduct[]> {
    const token = await this.login();
    return this.request<VeltrixProduct[]>("GET", "/products", token);
  }

  private async login(): Promise<string> {
    const auth = await this.request<VeltrixAuthResponse>("POST", "/auth/login", undefined, {
      email: this.email,
      password: this.senha,
    });
    if (!auth.token) {
      throw new UnauthorizedException("Login no Veltrix não retornou token.");
    }
    return auth.token;
  }

  private async request<T>(method: string, path: string, token?: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new InternalServerErrorException(
        `Não foi possível conectar ao Veltrix em ${this.baseUrl}: ${(err as Error).message}`,
      );
    }

    if (res.status === 401 || res.status === 403) {
      throw new UnauthorizedException("Credenciais do Veltrix inválidas ou expiradas.");
    }
    if (!res.ok) {
      const errorBody = await res.text();
      throw new InternalServerErrorException(`Veltrix API error (${res.status}): ${errorBody}`);
    }

    return (await res.json()) as T;
  }
}
