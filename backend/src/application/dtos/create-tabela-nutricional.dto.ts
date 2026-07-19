import { Type } from "class-transformer";
import { ArrayMaxSize, IsIn, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

const UNIDADES = ["KCAL_KJ", "G", "MG", "MCG"] as const;

export class TabelaNutricionalItemDto {
  @IsInt()
  ordem!: number;

  @IsString()
  ingrediente!: string;

  @IsIn(UNIDADES)
  unidade!: (typeof UNIDADES)[number];

  @IsNumber()
  valor!: number;

  @IsNumber()
  porcentagem!: number;
}

export class CreateTabelaNutricionalDto {
  @IsInt()
  numero!: number;

  @IsString()
  nome!: string;

  @IsOptional()
  @IsString()
  porcao?: string;

  @ArrayMaxSize(17)
  @ValidateNested({ each: true })
  @Type(() => TabelaNutricionalItemDto)
  itens!: TabelaNutricionalItemDto[];
}
