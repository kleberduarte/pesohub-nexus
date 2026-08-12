import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSubSetorDto {
  @IsInt()
  numero!: number;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
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
