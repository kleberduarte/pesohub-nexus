import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateFornecedorDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  informacao?: string;
}
