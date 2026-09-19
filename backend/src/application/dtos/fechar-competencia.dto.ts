import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

/** Fechamento do mês do contrato da fabricante (card #97). */
export class FecharCompetenciaDto {
  /** Mês de referência, AAAA-MM. Validado aqui para não estourar lá dentro. */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "competencia deve estar no formato AAAA-MM" })
  competencia!: string;

  /** CNPJ da fabricante — só exigido na primeira cobrança. */
  @IsOptional()
  @IsString()
  @MaxLength(24)
  cpfCnpj?: string;
}
