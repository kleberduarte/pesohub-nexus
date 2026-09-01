import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateOperadorDto {
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
  @IsNotEmpty()
  @MaxLength(7)
  senha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  codigo?: string;

  @IsOptional()
  @IsObject()
  permissoes?: Record<string, boolean>;
}
