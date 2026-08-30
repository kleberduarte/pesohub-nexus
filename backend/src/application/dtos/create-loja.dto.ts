import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

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

  @IsOptional()
  @IsString()
  @MaxLength(24)
  cnpj?: string;
}
