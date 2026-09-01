import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateFormatoImpressaoDto {
  /** Ver comentário no CreateFormatoImpressaoDto — faixa 1-99 confirmada
   * empiricamente no hardware físico. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  numero?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsInt()
  tipo?: number;

  @IsOptional()
  @IsInt()
  larguraMm?: number;

  @IsOptional()
  @IsInt()
  alturaMm?: number;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
