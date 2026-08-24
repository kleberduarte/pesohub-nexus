import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

const UNIDADES = ["KCAL_KJ", "G", "MG", "MCG"] as const;

export class TabelaNutricionalItemDto {
  @IsInt()
  ordem!: number;

  @IsString()
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
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  porcao?: string;

  @IsOptional()
  @IsInt()
  porcoesPorEmbalagem?: number;

  @IsOptional()
  @IsString()
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
