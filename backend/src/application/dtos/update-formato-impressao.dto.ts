import { IsInt, IsObject, IsOptional, IsString } from "class-validator";

export class UpdateFormatoImpressaoDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
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
