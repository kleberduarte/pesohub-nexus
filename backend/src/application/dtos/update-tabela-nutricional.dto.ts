import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { TabelaNutricionalItemDto } from "./create-tabela-nutricional.dto";

export class UpdateTabelaNutricionalDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

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

  @IsOptional()
  @ArrayMaxSize(17)
  @ValidateNested({ each: true })
  @Type(() => TabelaNutricionalItemDto)
  itens?: TabelaNutricionalItemDto[];
}
