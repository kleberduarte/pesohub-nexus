import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateImagemDto } from "../../../application/dtos/create-imagem.dto";
import { UpdateImagemDto } from "../../../application/dtos/update-imagem.dto";
import { IMAGEM_REPOSITORY, ImagemRepository } from "../../../domain/repositories/imagem.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("imagens")
@UseGuards(JwtAuthGuard)
@Controller("imagens")
export class ImagensController {
  constructor(@Inject(IMAGEM_REPOSITORY) private readonly imagens: ImagemRepository) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.imagens.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.imagens.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateImagemDto, @Req() req: Request) {
    return this.imagens.create({ ...dto, clienteId: this.clienteId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateImagemDto, @Req() req: Request) {
    return this.imagens.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.imagens.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
