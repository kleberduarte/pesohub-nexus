import { Inject, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { OPERADOR_REPOSITORY, OperadorRepository } from "../../domain/repositories/operador.repository";
import { CreateOperadorDto } from "../dtos/create-operador.dto";

@Injectable()
export class CreateOperadorUseCase {
  constructor(@Inject(OPERADOR_REPOSITORY) private readonly operadores: OperadorRepository) {}

  async execute(clienteId: string, dto: CreateOperadorDto) {
    const senhaHash = await bcrypt.hash(dto.senha, 10);
    return this.operadores.create({
      clienteId,
      numero: dto.numero,
      nome: dto.nome,
      senha: senhaHash,
      codigo: dto.codigo ?? null,
      permissoes: dto.permissoes ?? null,
    });
  }
}
