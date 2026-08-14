import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { CreateClienteDto } from "../../../application/dtos/create-cliente.dto";
import { UpdateClienteParametrosDto } from "../../../application/dtos/update-cliente-parametros.dto";

const CLIENTE_SELECT = {
  id: true,
  accessToken: true,
  nome: true,
  logoUrl: true,
  corPrimaria: true,
  corSecundaria: true,
  corFundo: true,
  corTexto: true,
  corBotao: true,
  corBotaoTexto: true,
  tagline: true,
  chavePix: true,
  suporteEmail: true,
  suporteWhatsapp: true,
  isDefault: true,
};

@ApiTags("clientes")
@UseGuards(JwtAuthGuard)
@Controller("clientes")
export class ClientesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  async list() {
    return this.prisma.cliente.findMany({
      select: CLIENTE_SELECT,
      orderBy: { nome: "asc" },
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  async create(@Body() dto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: { nome: dto.nome.trim() },
      select: CLIENTE_SELECT,
    });
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN")
  async remove(@Param("id") id: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      throw new NotFoundException("Empresa não encontrada");
    }
    if (cliente.isDefault) {
      throw new ForbiddenException("A empresa padrão não pode ser excluída");
    }

    const users = await this.prisma.user.count({ where: { clienteId: id } });
    if (users > 0) {
      throw new ConflictException("Empresa possui usuários vinculados — remova-os antes de excluir");
    }

    // Cliente não tem onDelete: Cascade pra quase nenhuma relação no schema —
    // deleteMany direto quebra com FK violation assim que existe qualquer
    // Loja/Device/Product/Assinatura/etc. vinculado. Apaga tudo em ordem
    // (filhos antes de pais) numa transação só, senão fica órfão.
    await this.prisma.$transaction([
      this.prisma.syncJobItem.deleteMany({
        where: {
          OR: [{ product: { clienteId: id } }, { job: { device: { clienteId: id } } }],
        },
      }),
      this.prisma.syncJob.deleteMany({ where: { device: { clienteId: id } } }),
      this.prisma.tabelaNutricionalItem.deleteMany({ where: { tabela: { clienteId: id } } }),
      this.prisma.product.deleteMany({ where: { clienteId: id } }),
      this.prisma.device.deleteMany({ where: { clienteId: id } }),
      this.prisma.deviceGroup.deleteMany({ where: { clienteId: id } }),
      this.prisma.agent.deleteMany({ where: { clienteId: id } }),
      this.prisma.subSetor.deleteMany({ where: { clienteId: id } }),
      this.prisma.setor.deleteMany({ where: { clienteId: id } }),
      this.prisma.fornecedor.deleteMany({ where: { clienteId: id } }),
      this.prisma.alergico.deleteMany({ where: { clienteId: id } }),
      this.prisma.tabelaNutricional.deleteMany({ where: { clienteId: id } }),
      this.prisma.operador.deleteMany({ where: { clienteId: id } }),
      this.prisma.imagem.deleteMany({ where: { clienteId: id } }),
      this.prisma.formatoImpressao.deleteMany({ where: { clienteId: id } }),
      this.prisma.codigoBarrasFormato.deleteMany({ where: { clienteId: id } }),
      this.prisma.textoGlobal.deleteMany({ where: { clienteId: id } }),
      this.prisma.teclaAcessoRapido.deleteMany({ where: { clienteId: id } }),
      this.prisma.specParametro.deleteMany({ where: { clienteId: id } }),
      this.prisma.configuracaoAvancada.deleteMany({ where: { clienteId: id } }),
      this.prisma.perfilLojaAcesso.deleteMany({ where: { loja: { clienteId: id } } }),
      this.prisma.loja.deleteMany({ where: { clienteId: id } }),
      this.prisma.perfil.deleteMany({ where: { clienteId: id } }),
      this.prisma.fatura.deleteMany({ where: { assinatura: { clienteId: id } } }),
      this.prisma.assinatura.deleteMany({ where: { clienteId: id } }),
      this.prisma.cliente.delete({ where: { id } }),
    ]);
    return { deleted: true };
  }

  @Get("default")
  async getDefault() {
    const cliente = await this.prisma.cliente.findFirst({
      where: { isDefault: true },
      select: CLIENTE_SELECT,
    });
    if (!cliente) {
      throw new NotFoundException("Nenhuma empresa padrão configurada");
    }
    return cliente;
  }

  @Get("me/branding")
  async branding(@Req() req: Request) {
    const clienteId = (req as unknown as { user: { clienteId: string } }).user.clienteId;
    return this.prisma.cliente.findUniqueOrThrow({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        logoUrl: true,
        corPrimaria: true,
        corSecundaria: true,
        tagline: true,
        accessToken: true,
      },
    });
  }

  @Get("me")
  async me(@Req() req: Request) {
    const clienteId = (req as unknown as { user: { clienteId: string | null } }).user.clienteId;
    if (!clienteId) {
      throw new NotFoundException("Nenhuma empresa selecionada");
    }
    return this.prisma.cliente.findUniqueOrThrow({
      where: { id: clienteId },
      select: CLIENTE_SELECT,
    });
  }

  @Patch("me")
  async updateMe(@Req() req: Request, @Body() dto: UpdateClienteParametrosDto) {
    const clienteId = (req as unknown as { user: { clienteId: string | null } }).user.clienteId;
    if (!clienteId) {
      throw new NotFoundException("Nenhuma empresa selecionada");
    }
    return this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nome: dto.nome.trim(),
        logoUrl: dto.logoUrl ?? null,
        tagline: dto.tagline ?? null,
        corPrimaria: dto.corPrimaria ?? null,
        corSecundaria: dto.corSecundaria ?? null,
        corFundo: dto.corFundo ?? null,
        corTexto: dto.corTexto ?? null,
        corBotao: dto.corBotao ?? null,
        corBotaoTexto: dto.corBotaoTexto ?? null,
        chavePix: dto.chavePix ?? null,
        suporteEmail: dto.suporteEmail ?? null,
        suporteWhatsapp: dto.suporteWhatsapp ?? null,
      },
      select: CLIENTE_SELECT,
    });
  }
}
