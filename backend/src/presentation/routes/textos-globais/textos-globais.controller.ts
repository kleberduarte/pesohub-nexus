import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateTextoGlobalDto } from "../../../application/dtos/create-texto-global.dto";
import { UpdateTextoGlobalDto } from "../../../application/dtos/update-texto-global.dto";
import { TEXTO_GLOBAL_REPOSITORY, TextoGlobalRepository } from "../../../domain/repositories/texto-global.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("textos-globais")
@UseGuards(JwtAuthGuard)
@Controller("textos-globais")
export class TextosGlobaisController {
  constructor(@Inject(TEXTO_GLOBAL_REPOSITORY) private readonly textos: TextoGlobalRepository) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.textos.findAll(this.lojaId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.textos.findById(id, this.lojaId(req));
  }

  @Post()
  create(@Body() dto: CreateTextoGlobalDto, @Req() req: Request) {
    return this.textos.create({ ...dto, clienteId: this.clienteId(req), lojaId: this.lojaId(req) });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTextoGlobalDto, @Req() req: Request) {
    return this.textos.update(id, this.lojaId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.textos.delete(id, this.lojaId(req));
  }

  private lojaId(req: Request): string {
    return (req as unknown as { user: { lojaId: string } }).user.lojaId;
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
