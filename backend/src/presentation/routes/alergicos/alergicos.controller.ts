import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateAlergicoDto } from "../../../application/dtos/create-alergico.dto";
import { UpdateAlergicoDto } from "../../../application/dtos/update-alergico.dto";
import { ALERGICO_REPOSITORY, AlergicoRepository } from "../../../domain/repositories/alergico.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("alergicos")
@UseGuards(JwtAuthGuard)
@Controller("alergicos")
export class AlergicosController {
  constructor(@Inject(ALERGICO_REPOSITORY) private readonly alergicos: AlergicoRepository) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.alergicos.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.alergicos.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateAlergicoDto, @Req() req: Request) {
    return this.alergicos.create({ ...dto, clienteId: this.clienteId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateAlergicoDto, @Req() req: Request) {
    return this.alergicos.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.alergicos.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
