import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class UpdateTeclaAcessoRapidoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  modelo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pagina?: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
