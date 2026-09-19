import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class EsqueciSenhaDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;
}

export class RedefinirSenhaDto {
  /** Token do link (base64url de 32 bytes = 43 caracteres). */
  @IsString()
  @MinLength(20)
  @MaxLength(128)
  token!: string;

  /** Complexidade validada no serviço, com a lista de regras que faltaram. */
  @IsString()
  @MaxLength(128)
  @MinLength(8)
  novaSenha!: string;
}
