import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  status: string;
  nextDueDate: string;
  value: number;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
}

export interface CreateAsaasCustomerInput {
  name: string;
  email?: string;
  cpfCnpj?: string;
  externalReference?: string;
}

export interface CreateAsaasSubscriptionInput {
  customer: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  value: number;
  nextDueDate: string;
  cycle?: "MONTHLY";
  description?: string;
}

@Injectable()
export class AsaasService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>("ASAAS_API_KEY");
    this.baseUrl = this.config.get<string>("ASAAS_BASE_URL") ?? "https://sandbox.asaas.com/api/v3";
  }

  async createCustomer(input: CreateAsaasCustomerInput): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>("POST", "/customers", input);
  }

  async createSubscription(input: CreateAsaasSubscriptionInput): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>("POST", "/subscriptions", { cycle: "MONTHLY", ...input });
  }

  async cancelSubscription(asaasSubscriptionId: string): Promise<void> {
    await this.request("DELETE", `/subscriptions/${asaasSubscriptionId}`);
  }

  async getPayment(asaasPaymentId: string): Promise<Record<string, unknown>> {
    return this.request("GET", `/payments/${asaasPaymentId}`);
  }

  private async request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        access_token: this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new InternalServerErrorException(`Asaas API error (${res.status}): ${errorBody}`);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }
}
