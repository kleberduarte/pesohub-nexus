import { Injectable, NotFoundException } from "@nestjs/common";
import { generateAgentToken, hashAgentToken } from "../../domain/services/agent-token";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { ImportDeviceRowDto } from "../dtos/import-devices.dto";

export interface BulkImportLojaResult {
  lojaId: string;
  agentId: string;
  /** Só preenchido quando o Agent da loja foi criado agora — nunca reexibido depois. */
  agentToken: string | null;
  devicesCreated: number;
}

/**
 * Importa balanças em lote para o onboarding de redes grandes (ex: Pão de
 * Açúcar, ~500 lojas x 5 balanças = 2.500 devices). Agrupa as linhas por
 * lojaId: reaproveita o Agent existente da loja (se já tiver sido instalado)
 * ou cria um novo, devolvendo o token gerado só nesse momento (mesma regra de
 * segurança do CreateAgentUseCase — token nunca é reexibido depois de criado).
 *
 * Os Devices são inseridos com um único `createMany` (em vez de um create por
 * linha) — com 2.500 linhas, N chamadas individuais ao Postgres seriam a
 * parte mais lenta do import; só os Agents (1 por loja, ~500) ainda são
 * resolvidos um a um, já que cada um pode precisar decidir criar-ou-reaproveitar.
 */
@Injectable()
export class BulkImportDevicesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(clienteId: string, rows: ImportDeviceRowDto[]): Promise<BulkImportLojaResult[]> {
    const rowsByLoja = new Map<string, ImportDeviceRowDto[]>();
    for (const row of rows) {
      const lojaRows = rowsByLoja.get(row.lojaId) ?? [];
      lojaRows.push(row);
      rowsByLoja.set(row.lojaId, lojaRows);
    }

    const lojaIds = [...rowsByLoja.keys()];
    const lojas = await this.prisma.loja.findMany({ where: { clienteId, id: { in: lojaIds } } });
    if (lojas.length !== lojaIds.length) {
      const encontradas = new Set(lojas.map((l) => l.id));
      const faltando = lojaIds.filter((id) => !encontradas.has(id));
      throw new NotFoundException(`Loja(s) não encontrada(s): ${faltando.join(", ")}`);
    }

    const existingAgents = await this.prisma.agent.findMany({
      where: { clienteId, lojaId: { in: lojaIds } },
    });
    const agentByLoja = new Map(existingAgents.map((a) => [a.lojaId, a]));

    const results: BulkImportLojaResult[] = [];
    const deviceRows: {
      clienteId: string;
      lojaId: string;
      nome: string;
      ip: string;
      porta: number;
      agentId: string;
      status: "NOT_CONFIGURED";
    }[] = [];

    for (const [lojaId, lojaRows] of rowsByLoja) {
      let agent = agentByLoja.get(lojaId);
      let agentToken: string | null = null;

      if (!agent) {
        const token = generateAgentToken();
        agent = await this.prisma.agent.create({
          data: { clienteId, lojaId, tokenHash: hashAgentToken(token), versao: "0.0.0" },
        });
        agentToken = token;
      }

      for (const row of lojaRows) {
        deviceRows.push({
          clienteId,
          lojaId,
          nome: row.nome,
          ip: row.ip,
          porta: row.porta ?? 33581,
          agentId: agent.id,
          status: "NOT_CONFIGURED",
        });
      }

      results.push({ lojaId, agentId: agent.id, agentToken, devicesCreated: lojaRows.length });
    }

    if (deviceRows.length > 0) {
      await this.prisma.device.createMany({ data: deviceRows });
    }

    return results;
  }
}
