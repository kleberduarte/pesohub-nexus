import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

const UNIDADES = ["KCAL_KJ", "G", "MG", "MCG"] as const;

export class TabelaNutricionalItemDto {
  @IsInt()
  ordem!: number;

  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  ingrediente!: string;

  @IsIn(UNIDADES)
  unidade!: (typeof UNIDADES)[number];

  @Type(() => Number)
  @IsNumber()
  valor!: number;

  @Type(() => Number)
  @IsNumber()
  porcentagem!: number;
}

export class CreateTabelaNutricionalDto {
  @IsInt()
  numero!: number;

  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  porcao?: string;

  @IsOptional()
  @IsInt()
  porcoesPorEmbalagem?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ingredientes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selos?: string[];

  @ArrayMaxSize(17)
  @ValidateNested({ each: true })
  @Type(() => TabelaNutricionalItemDto)
  itens!: TabelaNutricionalItemDto[];
}
