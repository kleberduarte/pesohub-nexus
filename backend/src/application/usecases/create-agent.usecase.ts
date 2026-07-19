import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../infrastructure/database/prisma.service";

/**
 * Gera um Agent (token único) por loja. Esse token vai no AGENT_TOKEN do .env
 * do agent-local instalado na rede da loja — ver agent-local/installer/install.ps1.
 * Nunca reaproveitar o mesmo token entre lojas: é ele que autentica a conexão
 * WebSocket em AgentGateway.handleConnection e escopa o cliente/tenant.
 */
@Injectable()
export class CreateAgentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(clienteId: string, lojaId: string) {
    const token = randomBytes(24).toString("base64url");
    return this.prisma.agent.create({
      data: { clienteId, lojaId, token, versao: "0.0.0" },
    });
  }
}
