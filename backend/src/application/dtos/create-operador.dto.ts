import { IsInt, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateOperadorDto {
  @IsInt()
  numero!: number;

  @IsString()
  nome!: string;

  @IsString()
  @MaxLength(7)
  senha!: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsObject()
  permissoes?: Record<string, boolean>;
}
