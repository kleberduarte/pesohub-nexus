import { IsBoolean, IsNumber, IsOptional, IsString, Length, Matches } from "class-validator";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  @Length(13, 13)
  @Matches(/^\d{13}$/, { message: "codigoBarras deve conter 13 dígitos (EAN-13)" })
  codigoBarras?: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsNumber()
  preco?: number;

  @IsOptional()
  @IsString()
  categoriaImposto?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
