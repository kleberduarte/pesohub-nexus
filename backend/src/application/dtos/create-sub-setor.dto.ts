import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSubSetorDto {
  @IsInt()
  numero!: number;

  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @MaxLength(128)
  @IsNotEmpty()
  setorId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  formatoImpressaoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  codigoBarrasFormatoId?: string;

  @IsOptional()
  @IsInt()
  bandeiraCodigoBarras?: number;
}
