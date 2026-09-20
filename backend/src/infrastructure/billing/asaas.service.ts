import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
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

export interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  dueDate?: string;
  paymentDate?: string;
  invoiceUrl?: string;
  subscription?: string;
  externalReference?: string;
}

/** Resposta de GET /payments/{id}/pixQrCode. */
export interface AsaasPixQrCode {
  /** PNG do QR em base64, SEM o prefixo "data:image/png;base64,". */
  encodedImage?: string;
  /** Código copia-e-cola (BR Code). */
  payload?: string;
  expirationDate?: string;
}

/** Resposta de GET /payments/{id}/identificationField. */
export interface AsaasLinhaDigitavel {
  identificationField?: string;
  nossoNumero?: string;
  barCode?: string;
}

export interface CreateAsaasPaymentInput {
  customer: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>("ASAAS_API_KEY") ?? "";
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

  async getPayment(asaasPaymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>("GET", `/payments/${asaasPaymentId}`);
  }

  /**
   * Dados do Pix de uma cobrança: imagem do QR em base64 e o código
   * copia-e-cola. Leitura pura — não emite nada no Asaas (card #101).
   */
  async getPixQrCode(asaasPaymentId: string): Promise<AsaasPixQrCode> {
    return this.request<AsaasPixQrCode>("GET", `/payments/${asaasPaymentId}/pixQrCode`);
  }

  /**
   * Linha digitável do boleto. Também é leitura pura; o Asaas só responde
   * quando a cobrança tem boleto emitido.
   */
  async getLinhaDigitavel(asaasPaymentId: string): Promise<AsaasLinhaDigitavel> {
    return this.request<AsaasLinhaDigitavel>("GET", `/payments/${asaasPaymentId}/identificationField`);
  }

  /**
   * Muda o valor da assinatura quando a rede ganha ou perde balanças.
   * Sem `updatePendingPayments`, a mudança vale só para as próximas cobranças —
   * uma cobrança já emitida não muda de valor no meio do caminho.
   */
  async updateSubscriptionValue(asaasSubscriptionId: string, value: number): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>("PUT", `/subscriptions/${asaasSubscriptionId}`, {
      value,
      updatePendingPayments: false,
    });
  }

  /**
   * Cobrança avulsa: é o formato do contrato da fabricante, em que cada mês
   * fecha com uma quantidade diferente de balanças.
   */
  async createPayment(input: CreateAsaasPaymentInput): Promise<AsaasPayment> {
    return this.request<AsaasPayment>("POST", "/payments", input);
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
      // O corpo do erro do Asaas traz ids internos, a referência externa
      // (empresa:rede) e dados da conta. Fica no log do servidor; para quem
      // chamou vai só o essencial.
      const errorBody = await res.text();
      this.logger.error(`Asaas ${method} ${path} falhou (${res.status}): ${errorBody}`);
      throw new InternalServerErrorException(
        `Não foi possível concluir a operação no provedor de pagamento (${res.status}).`,
      );
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }
}
