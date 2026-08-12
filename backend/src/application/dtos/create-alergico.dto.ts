import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAlergicoDto {
  @IsInt()
  numero!: number;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  informacao?: string;
}
