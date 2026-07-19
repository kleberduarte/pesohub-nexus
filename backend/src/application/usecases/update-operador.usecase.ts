import { Inject, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { OPERADOR_REPOSITORY, OperadorRepository } from "../../domain/repositories/operador.repository";
import { UpdateOperadorDto } from "../dtos/update-operador.dto";

@Injectable()
export class UpdateOperadorUseCase {
  constructor(@Inject(OPERADOR_REPOSITORY) private readonly operadores: OperadorRepository) {}

  async execute(id: string, clienteId: string, dto: UpdateOperadorDto) {
    const senhaHash = dto.senha ? await bcrypt.hash(dto.senha, 10) : undefined;
    return this.operadores.update(id, clienteId, {
      ...dto,
      senha: senhaHash,
    });
  }
}
