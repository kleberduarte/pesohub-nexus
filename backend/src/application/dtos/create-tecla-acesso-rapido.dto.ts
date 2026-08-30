import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateTeclaAcessoRapidoDto {
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @MaxLength(60)
  @IsNotEmpty()
  modelo!: string;

  @IsString()
  @MaxLength(60)
  @IsNotEmpty()
  pagina!: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
