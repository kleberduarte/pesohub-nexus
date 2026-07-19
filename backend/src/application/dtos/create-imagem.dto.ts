import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateImagemDto {
  @IsString()
  nome!: string;

  @IsString()
  url!: string;

  @IsOptional()
  @IsNumber()
  larguraMm?: number;

  @IsOptional()
  @IsNumber()
  alturaMm?: number;
}
