import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateFornecedorDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  informacao?: string;
}
