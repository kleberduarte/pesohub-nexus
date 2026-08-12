import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateOperadorDto {
  @IsInt()
  numero!: number;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  senha!: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsObject()
  permissoes?: Record<string, boolean>;
}
