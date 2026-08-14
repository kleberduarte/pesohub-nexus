import { IsOptional, IsString, Length, Matches } from "class-validator";

const DOMINIO = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export class CreateClienteDto {
  @IsString()
  @Length(3, 200)
  nome!: string;

  @IsOptional()
  @IsString()
  @Matches(DOMINIO, { message: "dominio deve ser um domínio válido, ex.: empresa.com.br" })
  dominio?: string;
}
