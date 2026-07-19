import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateSubSetorDto } from "../../../application/dtos/create-sub-setor.dto";
import { UpdateSubSetorDto } from "../../../application/dtos/update-sub-setor.dto";
import { SUB_SETOR_REPOSITORY, SubSetorRepository } from "../../../domain/repositories/sub-setor.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("sub-setores")
@UseGuards(JwtAuthGuard)
@Controller("sub-setores")
export class SubSetoresController {
  constructor(@Inject(SUB_SETOR_REPOSITORY) private readonly subSetores: SubSetorRepository) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.subSetores.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.subSetores.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateSubSetorDto, @Req() req: Request) {
    return this.subSetores.create({ ...dto, clienteId: this.clienteId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSubSetorDto, @Req() req: Request) {
    return this.subSetores.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.subSetores.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
