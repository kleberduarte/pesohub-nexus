import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateSubSetorDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  setorId?: string;

  @IsOptional()
  @IsString()
  formatoImpressaoId?: string;

  @IsOptional()
  @IsString()
  codigoBarrasFormatoId?: string;

  @IsOptional()
  @IsInt()
  bandeiraCodigoBarras?: number;
}
