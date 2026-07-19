import { IsIn, IsInt, IsObject, IsOptional, IsString } from "class-validator";

const TIPOS = ["EAN13", "EAN128"] as const;

export class UpdateCodigoBarrasFormatoDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsIn(TIPOS)
  tipo?: (typeof TIPOS)[number];

  @IsOptional()
  @IsInt()
  verificador?: number;

  @IsOptional()
  @IsInt()
  constante1?: number;

  @IsOptional()
  @IsInt()
  constante2?: number;

  @IsOptional()
  @IsObject()
  detalhes?: Record<string, unknown>;
}
