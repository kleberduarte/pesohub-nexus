import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateSubSetorDto {
  @IsInt()
  numero!: number;

  @IsString()
  nome!: string;

  @IsString()
  setorId!: string;

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
