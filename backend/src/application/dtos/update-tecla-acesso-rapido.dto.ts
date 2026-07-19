import { IsObject, IsOptional, IsString } from "class-validator";

export class UpdateTeclaAcessoRapidoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  pagina?: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
