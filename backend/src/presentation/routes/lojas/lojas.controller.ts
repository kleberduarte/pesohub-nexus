import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { CreateLojaDto } from "../../../application/dtos/create-loja.dto";
import { UpdateLojaDto } from "../../../application/dtos/update-loja.dto";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";

@ApiTags("lojas")
@UseGuards(JwtAuthGuard)
@Controller("lojas")
export class LojasController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.prisma.loja.findMany({ where: { clienteId: this.clienteId(req) }, orderBy: { nome: "asc" } });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.prisma.loja.findFirst({ where: { id, clienteId: this.clienteId(req) } });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  create(@Body() dto: CreateLojaDto, @Req() req: Request) {
    return this.prisma.loja.create({ data: { ...dto, clienteId: this.clienteId(req) } });
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  async update(@Param("id") id: string, @Body() dto: UpdateLojaDto, @Req() req: Request) {
    const result = await this.prisma.loja.updateMany({
      where: { id, clienteId: this.clienteId(req) },
      data: dto,
    });
    if (result.count === 0) {
      return null;
    }
    return this.prisma.loja.findFirst({ where: { id } });
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  async remove(@Param("id") id: string, @Req() req: Request) {
    const clienteId = this.clienteId(req);
    const loja = await this.prisma.loja.findFirst({ where: { id, clienteId } });
    if (!loja) {
      throw new NotFoundException();
    }

    // Loja não tem onDelete: Cascade pra maioria das relações no schema (só
    // PerfilLojaAcesso tem) — deleteMany direto na Loja quebra com FK violation
    // assim que existe qualquer Device/Product/etc. vinculado. Apaga tudo em
    // ordem (filhos antes de pais) numa transação só, senão fica órfão.
    await this.prisma.$transaction([
      this.prisma.syncJobItem.deleteMany({
        where: {
          OR: [{ product: { lojaId: id } }, { job: { device: { lojaId: id } } }],
        },
      }),
      this.prisma.syncJob.deleteMany({ where: { device: { lojaId: id } } }),
      this.prisma.tabelaNutricionalItem.deleteMany({ where: { tabela: { lojaId: id } } }),
      this.prisma.product.deleteMany({ where: { lojaId: id } }),
      this.prisma.device.deleteMany({ where: { lojaId: id } }),
      this.prisma.deviceGroup.deleteMany({ where: { lojaId: id } }),
      this.prisma.agent.deleteMany({ where: { lojaId: id } }),
      this.prisma.subSetor.deleteMany({ where: { lojaId: id } }),
      this.prisma.setor.deleteMany({ where: { lojaId: id } }),
      this.prisma.fornecedor.deleteMany({ where: { lojaId: id } }),
      this.prisma.alergico.deleteMany({ where: { lojaId: id } }),
      this.prisma.tabelaNutricional.deleteMany({ where: { lojaId: id } }),
      this.prisma.operador.deleteMany({ where: { lojaId: id } }),
      this.prisma.imagem.deleteMany({ where: { lojaId: id } }),
      this.prisma.formatoImpressao.deleteMany({ where: { lojaId: id } }),
      this.prisma.codigoBarrasFormato.deleteMany({ where: { lojaId: id } }),
      this.prisma.textoGlobal.deleteMany({ where: { lojaId: id } }),
      this.prisma.teclaAcessoRapido.deleteMany({ where: { lojaId: id } }),
      this.prisma.specParametro.deleteMany({ where: { lojaId: id } }),
      this.prisma.configuracaoAvancada.deleteMany({ where: { lojaId: id } }),
      this.prisma.perfilLojaAcesso.deleteMany({ where: { lojaId: id } }),
      this.prisma.loja.delete({ where: { id } }),
    ]);
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
