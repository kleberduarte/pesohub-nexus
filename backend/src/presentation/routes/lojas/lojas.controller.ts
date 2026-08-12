import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
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
    await this.prisma.loja.deleteMany({ where: { id, clienteId: this.clienteId(req) } });
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
