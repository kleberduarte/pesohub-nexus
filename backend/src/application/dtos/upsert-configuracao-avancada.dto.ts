import { IsInt, IsObject, IsOptional, IsString } from "class-validator";

export class UpsertConfiguracaoAvancadaDto {
  @IsOptional()
  @IsObject()
  menusHabilitados?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  funcaoPluPermitir?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  fonteExibicao?: string;

  @IsOptional()
  @IsString()
  formatoDataHora?: string;

  @IsOptional()
  @IsInt()
  excluirRegistrosDias?: number;

  @IsOptional()
  @IsObject()
  importacaoPluCampos?: Record<string, boolean>;
}
