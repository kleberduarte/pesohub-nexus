import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateFornecedorDto {
  @IsInt()
  numero!: number;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  informacao?: string;
}
