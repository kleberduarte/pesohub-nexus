import { Type } from "class-transformer";
import { ArrayMaxSize, IsInt, IsOptional, IsString, ValidateNested } from "class-validator";
import { TabelaNutricionalItemDto } from "./create-tabela-nutricional.dto";

export class UpdateTabelaNutricionalDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  porcao?: string;

  @IsOptional()
  @ArrayMaxSize(17)
  @ValidateNested({ each: true })
  @Type(() => TabelaNutricionalItemDto)
  itens?: TabelaNutricionalItemDto[];
}
