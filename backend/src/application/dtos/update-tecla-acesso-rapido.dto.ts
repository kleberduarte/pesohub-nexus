import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateTeclaAcessoRapidoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @IsNotEmpty()
  modelo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @IsNotEmpty()
  pagina?: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
