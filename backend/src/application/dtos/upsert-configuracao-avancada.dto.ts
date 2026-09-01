import { IsInt, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class UpsertConfiguracaoAvancadaDto {
  @IsOptional()
  @IsObject()
  menusHabilitados?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  funcaoPluPermitir?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  fonteExibicao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  formatoDataHora?: string;

  @IsOptional()
  @IsInt()
  excluirRegistrosDias?: number;

  @IsOptional()
  @IsObject()
  importacaoPluCampos?: Record<string, boolean>;
}
