import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

/** Converte string vazia em undefined, já que @IsOptional() do class-validator só pula @IsEmail() para undefined/null, não para "". */
const emptyToUndefined = ({ value }: { value: unknown }) => (value === "" ? undefined : value);

export class CreateLojaDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  responsavel?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;
}
