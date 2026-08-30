import { IsOptional, IsString, Length, Matches, MaxLength } from "class-validator";

const DOMINIO = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export class CreateClienteDto {
  @IsString()
  @MaxLength(120)
  @Length(3, 200)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(DOMINIO, { message: "dominio deve ser um domínio válido, ex.: empresa.com.br" })
  dominio?: string;
}
