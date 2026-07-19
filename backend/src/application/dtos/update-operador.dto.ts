import { IsInt, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateOperadorDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  senha?: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsObject()
  permissoes?: Record<string, boolean>;
}
