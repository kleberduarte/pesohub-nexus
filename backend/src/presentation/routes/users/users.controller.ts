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
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { CreateUserDto } from "../../../application/dtos/create-user.dto";
import { UpdateUserDto } from "../../../application/dtos/update-user.dto";

interface AuthenticatedRequest extends Request {
  user: { sub: string; role: string; clienteId: string | null };
}

@ApiTags("users")
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    const clienteId = req.user.clienteId;
    if (!clienteId) return [];

    return this.prisma.user.findMany({
      where: { clienteId },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN")
  async create(@Body() dto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    const { role: creatorRole, clienteId } = req.user;
    if (!clienteId) {
      throw new ForbiddenException("Selecione uma empresa antes de cadastrar usuários");
    }
    if (dto.role === "SUPERADMIN" && creatorRole !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode cadastrar outro SUPERADMIN");
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Já existe um usuário com este e-mail");
    }

    // Um SUPERADMIN é vinculado à empresa dona do domínio do seu e-mail (ex.:
    // superadmin@ramuza.com.br → empresa Ramuza) e fica travado nela. O domínio
    // da empresa padrão (PesoHub) é a exceção: continua "global", sem clienteId
    // fixo, podendo trocar de empresa livremente como hoje.
    let clienteIdParaUsuario: string | null = clienteId;
    if (dto.role === "SUPERADMIN") {
      const dominio = dto.email.split("@")[1]?.toLowerCase();
      const clienteDoDominio = dominio ? await this.prisma.cliente.findUnique({ where: { dominio } }) : null;
      if (!clienteDoDominio) {
        throw new ConflictException(
          `Nenhuma empresa cadastrada com o domínio @${dominio} — cadastre o domínio da empresa antes de criar este usuário`,
        );
      }
      clienteIdParaUsuario = clienteDoDominio.isDefault ? null : clienteDoDominio.id;
    }

    const senha = await bcrypt.hash(dto.senha, 10);
    return this.prisma.user.create({
      data: { email: dto.email, senha, role: dto.role, clienteId: clienteIdParaUsuario },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    const { role: creatorRole, clienteId } = req.user;
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.clienteId !== clienteId) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if ((dto.role === "SUPERADMIN" || target.role === "SUPERADMIN") && creatorRole !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode alterar um usuário SUPERADMIN");
    }

    const data: { role?: typeof dto.role; senha?: string } = {};
    if (dto.role) data.role = dto.role;
    if (dto.senha) data.senha = await bcrypt.hash(dto.senha, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, createdAt: true },
    });
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("SUPERADMIN", "ADMIN")
  async remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const { sub, role: creatorRole, clienteId } = req.user;
    if (id === sub) {
      throw new ForbiddenException("Você não pode excluir seu próprio usuário");
    }

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.clienteId !== clienteId) {
      throw new NotFoundException("Usuário não encontrado");
    }
    if (target.role === "SUPERADMIN" && creatorRole !== "SUPERADMIN") {
      throw new ForbiddenException("Apenas SUPERADMIN pode excluir um usuário SUPERADMIN");
    }

    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
