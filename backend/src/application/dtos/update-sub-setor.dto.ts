import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSubSetorDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @IsNotEmpty()
  setorId?: string;

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
