import { IsObject, IsOptional, IsString } from "class-validator";

export class CreateTeclaAcessoRapidoDto {
  @IsString()
  nome!: string;

  @IsString()
  modelo!: string;

  @IsString()
  pagina!: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
