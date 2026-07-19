import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateSetorDto } from "../../../application/dtos/create-setor.dto";
import { UpdateSetorDto } from "../../../application/dtos/update-setor.dto";
import { SETOR_REPOSITORY, SetorRepository } from "../../../domain/repositories/setor.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("setores")
@UseGuards(JwtAuthGuard)
@Controller("setores")
export class SetoresController {
  constructor(@Inject(SETOR_REPOSITORY) private readonly setores: SetorRepository) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.setores.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.setores.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateSetorDto, @Req() req: Request) {
    return this.setores.create({ ...dto, clienteId: this.clienteId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSetorDto, @Req() req: Request) {
    return this.setores.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.setores.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
