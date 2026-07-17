import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from "class-validator";

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

export class UpdateClienteParametrosDto {
  @IsString()
  @Length(3, 200)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  tagline?: string;

  @IsOptional()
  @IsString()
  @Matches(HEX6, { message: "corPrimaria deve estar no formato #RRGGBB" })
  corPrimaria?: string;

  @IsOptional()
  @IsString()
  @Matches(HEX6, { message: "corSecundaria deve estar no formato #RRGGBB" })
  corSecundaria?: string;

  @IsOptional()
  @IsString()
  @Matches(HEX6, { message: "corFundo deve estar no formato #RRGGBB" })
  corFundo?: string;

  @IsOptional()
  @IsString()
  @Matches(HEX6, { message: "corTexto deve estar no formato #RRGGBB" })
  corTexto?: string;

  @IsOptional()
  @IsString()
  @Matches(HEX6, { message: "corBotao deve estar no formato #RRGGBB" })
  corBotao?: string;

  @IsOptional()
  @IsString()
  @Matches(HEX6, { message: "corBotaoTexto deve estar no formato #RRGGBB" })
  corBotaoTexto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(77)
  chavePix?: string;

  @IsOptional()
  @IsEmail()
  suporteEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  suporteWhatsapp?: string;
}
