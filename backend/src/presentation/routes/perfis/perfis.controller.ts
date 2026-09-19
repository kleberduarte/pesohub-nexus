import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ehPerfilDeRede } from "../../../domain/services/acesso-por-dominio";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { CreatePerfilDto } from "../../../application/dtos/create-perfil.dto";
import { UpdatePerfilDto } from "../../../application/dtos/update-perfil.dto";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";

@ApiTags("perfis")
@UseGuards(RolesGuard)
@Roles("ADMIN", "SUPERADMIN")
@Controller("perfis")
export class PerfisController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.prisma.perfil.findMany({
      where: { clienteId: this.clienteId(req) },
      orderBy: { nome: "asc" },
      include: { lojas: { include: { loja: true } } },
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.prisma.perfil.findFirst({
      where: { id, clienteId: this.clienteId(req) },
      include: { lojas: { include: { loja: true } } },
    });
  }

  @Post()
  async create(@Body() dto: CreatePerfilDto, @Req() req: Request) {
    const clienteId = this.clienteId(req);
    this.recusarNomeDeRede(dto.nome);
    return this.prisma.perfil.create({
      data: {
        nome: dto.nome,
        clienteId,
        lojas: dto.lojaIds ? { create: dto.lojaIds.map((lojaId) => ({ lojaId })) } : undefined,
      },
      include: { lojas: { include: { loja: true } } },
    });
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdatePerfilDto, @Req() req: Request) {
    const clienteId = this.clienteId(req);
    const existing = await this.prisma.perfil.findFirst({ where: { id, clienteId } });
    if (!existing) return null;
    this.recusarPerfilDeRede(existing.nome);
    if (dto.nome) this.recusarNomeDeRede(dto.nome);

    if (dto.lojaIds) {
      await this.prisma.perfilLojaAcesso.deleteMany({ where: { perfilId: id } });
    }

    return this.prisma.perfil.update({
      where: { id },
      data: {
        nome: dto.nome,
        lojas: dto.lojaIds ? { create: dto.lojaIds.map((lojaId) => ({ lojaId })) } : undefined,
      },
      include: { lojas: { include: { loja: true } } },
    });
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string, @Req() req: Request) {
    const clienteId = this.clienteId(req);
    const existing = await this.prisma.perfil.findFirst({ where: { id, clienteId } });
    if (!existing) return;
    this.recusarPerfilDeRede(existing.nome);
    // Apagar um perfil em uso deixaria os usuários dele SEM perfil — e sem
    // perfil se enxerga todas as lojas. Troque o perfil deles antes.
    const emUso = await this.prisma.user.count({ where: { perfilId: id } });
    if (emUso > 0) {
      throw new ConflictException(`Este perfil está em uso por ${emUso} usuário(s). Troque o perfil deles antes de excluir.`);
    }
    await this.prisma.perfil.delete({ where: { id } });
  }

  /**
   * Perfis "Rede: ..." definem o que um supermercado enxerga (card #96) e são
   * mantidos pelo sistema a partir do domínio das lojas. Editar à mão poderia
   * pôr a loja de um concorrente no acesso de outro.
   */
  private recusarPerfilDeRede(nome: string): void {
    if (ehPerfilDeRede(nome)) {
      throw new BadRequestException(
        "Perfis de rede são mantidos automaticamente pelo domínio de e-mail das lojas e não podem ser alterados.",
      );
    }
  }

  private recusarNomeDeRede(nome: string): void {
    if (ehPerfilDeRede(nome)) {
      throw new BadRequestException('Nomes começando com "Rede:" são reservados aos perfis automáticos de rede.');
    }
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
