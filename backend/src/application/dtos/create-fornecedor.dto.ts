import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateFornecedorDto {
  @IsInt()
  numero!: number;

  @IsString()
  nome!: string;

  @IsOptional()
  @IsString()
  informacao?: string;
}
