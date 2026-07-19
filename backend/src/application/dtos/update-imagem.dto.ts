import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateImagemDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsNumber()
  larguraMm?: number;

  @IsOptional()
  @IsNumber()
  alturaMm?: number;
}
