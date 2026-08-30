import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DEVICE_REPOSITORY, DeviceRepository } from "../../domain/repositories/device.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { hashAgentToken } from "../../domain/services/agent-token";

/**
 * Vincula um Device a um Agent Local pelo token do agente (o mesmo usado em
 * AGENT_TOKEN no .env do agent-local). Sem esse vínculo o worker de sync não
 * consegue encontrar por qual Agent Local rotear o comando (ver processor.ts:
 * "não tem Agent Local vinculado — não é possível sincronizar").
 */
@Injectable()
export class LinkDeviceAgentUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY) private readonly devices: DeviceRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(deviceId: string, lojaId: string, agentToken: string) {
    const device = await this.devices.findById(deviceId, lojaId);
    if (!device) throw new NotFoundException("Balança não encontrada.");

    const agent = await this.prisma.agent.findUnique({ where: { tokenHash: hashAgentToken(agentToken) } });
    if (!agent || agent.lojaId !== lojaId) {
      throw new NotFoundException("Agent Local não encontrado para o token informado.");
    }

    return this.devices.update(deviceId, lojaId, { agentId: agent.id });
  }
}
