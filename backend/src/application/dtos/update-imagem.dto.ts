import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateImagemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  url?: string;

  @IsOptional()
  @IsNumber()
  larguraMm?: number;

  @IsOptional()
  @IsNumber()
  alturaMm?: number;
}
