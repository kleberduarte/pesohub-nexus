import { IsInt, IsObject, IsOptional, IsString } from "class-validator";

export class CreateFormatoImpressaoDto {
  @IsInt()
  numero!: number;

  @IsString()
  nome!: string;

  @IsOptional()
  @IsInt()
  tipo?: number;

  @IsInt()
  larguraMm!: number;

  @IsInt()
  alturaMm!: number;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
