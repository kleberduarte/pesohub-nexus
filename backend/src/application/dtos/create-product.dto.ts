import { IsBoolean, IsNumber, IsOptional, IsString, Length, Matches } from "class-validator";

export class CreateProductDto {
  @IsString()
  codigo!: string;

  @IsString()
  @Length(13, 13)
  @Matches(/^\d{13}$/, { message: "codigoBarras deve conter 13 dígitos (EAN-13)" })
  codigoBarras!: string;

  @IsString()
  nome!: string;

  @IsNumber()
  preco!: number;

  @IsOptional()
  @IsString()
  categoriaImposto?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
