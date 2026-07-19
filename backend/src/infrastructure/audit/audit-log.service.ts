import { Injectable, Logger } from "@nestjs/common";
import { Request } from "express";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registro é best-effort: uma falha ao gravar auditoria não pode derrubar
   * a ação de negócio que está sendo auditada.
   */
  async record(req: Request, acao: string, payload?: Record<string, unknown>): Promise<void> {
    const userId = (req as unknown as { user?: { sub?: string } }).user?.sub;
    try {
      await this.prisma.auditLog.create({
        data: { userId, acao, payload: (payload ?? {}) as Prisma.InputJsonValue },
      });
    } catch (err) {
      this.logger.warn(`Falha ao gravar audit log (${acao}): ${(err as Error).message}`);
    }
  }
}
