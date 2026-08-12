import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { CreatePerfilDto } from "../../../application/dtos/create-perfil.dto";
import { UpdatePerfilDto } from "../../../application/dtos/update-perfil.dto";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";

@ApiTags("perfis")
@UseGuards(JwtAuthGuard, RolesGuard)
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
    await this.prisma.perfil.deleteMany({ where: { id, clienteId: this.clienteId(req) } });
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
