import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { generateAgentToken, hashAgentToken } from "../../domain/services/agent-token";

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
    // O banco guarda só o hash — este é o único momento em que o token real
    // existe, e por isso ele volta junto na resposta para ser copiado para o
    // AGENT_TOKEN do agente. Não há como reexibi-lo depois.
    const token = generateAgentToken();
    const agent = await this.prisma.agent.create({
      data: { clienteId, lojaId, tokenHash: hashAgentToken(token), versao: "0.0.0" },
    });
    return { ...agent, token };
  }
}
