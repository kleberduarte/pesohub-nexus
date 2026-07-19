import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateSubSetorDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
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
