import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateAgentUseCase } from "../../../application/usecases/create-agent.usecase";
import { CreateAgentDto } from "../../../application/dtos/create-agent.dto";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { AuditLogService } from "../../../infrastructure/audit/audit-log.service";

@ApiTags("agents")
@UseGuards(JwtAuthGuard)
@Controller("agents")
export class AgentsController {
  constructor(
    private readonly createAgent: CreateAgentUseCase,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.prisma.agent.findMany({
      where: { clienteId: this.clienteId(req) },
      select: {
        id: true,
        lojaId: true,
        versao: true,
        ultimoHeartbeat: true,
        createdAt: true,
        // token nunca é retornado após a criação — só na resposta do POST.
      },
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  async create(@Body() dto: CreateAgentDto, @Req() req: Request) {
    const agent = await this.createAgent.execute(this.clienteId(req), dto.lojaId);
    await this.auditLog.record(req, "agent.create", { agentId: agent.id, lojaId: agent.lojaId });
    return agent;
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
