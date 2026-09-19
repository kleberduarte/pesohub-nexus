import { IsBoolean, IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

/** Contrato de licenciamento da fabricante (card #97). Só SUPERADMIN altera. */
export class UpsertContratoDto {
  @IsNumber()
  @Min(0.01)
  valorUnitario!: number;

  @IsInt()
  @Min(0)
  quantidadeMinima!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  diaVencimento?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
