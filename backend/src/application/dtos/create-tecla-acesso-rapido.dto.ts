import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateTeclaAcessoRapidoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  modelo!: string;

  @IsString()
  @IsNotEmpty()
  pagina!: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
