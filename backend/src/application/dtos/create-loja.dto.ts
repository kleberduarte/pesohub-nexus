import { Transform } from "class-transformer";
import { IsEmail, Matches, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

/** Converte string vazia em undefined, já que @IsOptional() do class-validator só pula @IsEmail() para undefined/null, não para "". */
const emptyToUndefined = ({ value }: { value: unknown }) => (value === "" ? undefined : value);

export class CreateLojaDto {
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  responsavel?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  @MaxLength(160)
  email?: string;

  /** Domínio de e-mail dos funcionários deste supermercado (card #96). "" limpa. */
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase().replace(/^@/, "") : value))
  @IsString()
  @MaxLength(255)
  @Matches(/^$|^[a-z0-9-]+(\.[a-z0-9-]+)+$/, { message: "dominioEmail deve ser um domínio válido, ex.: supermercado.com.br" })
  dominioEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  cnpj?: string;
}
