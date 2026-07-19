import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateOperadorUseCase } from "../../../application/usecases/create-operador.usecase";
import { UpdateOperadorUseCase } from "../../../application/usecases/update-operador.usecase";
import { CreateOperadorDto } from "../../../application/dtos/create-operador.dto";
import { UpdateOperadorDto } from "../../../application/dtos/update-operador.dto";
import { OPERADOR_REPOSITORY, OperadorRepository } from "../../../domain/repositories/operador.repository";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("operadores")
@UseGuards(JwtAuthGuard)
@Controller("operadores")
export class OperadoresController {
  constructor(
    private readonly createOperador: CreateOperadorUseCase,
    private readonly updateOperador: UpdateOperadorUseCase,
    @Inject(OPERADOR_REPOSITORY) private readonly operadores: OperadorRepository,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.operadores.findAll(this.clienteId(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.operadores.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateOperadorDto, @Req() req: Request) {
    return this.createOperador.execute(this.clienteId(req), dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateOperadorDto, @Req() req: Request) {
    return this.updateOperador.execute(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.operadores.delete(id, this.clienteId(req));
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
