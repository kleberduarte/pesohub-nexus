import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateOperadorDto {
  @IsInt()
  numero!: number;

  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  senha!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  codigo?: string;

  @IsOptional()
  @IsObject()
  permissoes?: Record<string, boolean>;
}
