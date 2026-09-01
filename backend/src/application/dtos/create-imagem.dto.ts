import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateImagemDto {
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @MaxLength(2048)
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsNumber()
  larguraMm?: number;

  @IsOptional()
  @IsNumber()
  alturaMm?: number;
}
