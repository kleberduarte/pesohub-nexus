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
        data: {
          userId,
          acao,
          payload: (payload ?? {}) as Prisma.InputJsonValue,
          ip: extrairIp(req),
          userAgent: req.headers?.["user-agent"]?.slice(0, 512) ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Falha ao gravar audit log (${acao}): ${(err as Error).message}`);
    }
  }
}

/**
 * IP real de quem fez a ação.
 *
 * Em produção o backend fica atrás do proxy da Railway, então `req.ip` é o IP
 * do proxy — o do cliente vem no primeiro item do `x-forwarded-for`. Só vale
 * confiar nesse cabeçalho porque o Express está com `trust proxy` (ver
 * main.ts); num servidor exposto direto ele seria forjável.
 */
function extrairIp(req: Request): string | null {
  const encaminhado = req.headers?.["x-forwarded-for"];
  const primeiro = Array.isArray(encaminhado) ? encaminhado[0] : encaminhado?.split(",")[0];
  return (primeiro?.trim() || req.ip) ?? null;
}
