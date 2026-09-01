import { IsString, MaxLength, MinLength } from "class-validator";

export class TrocarSenhaDto {
  @IsString()
  @MaxLength(128)
  @MinLength(1)
  senhaAtual!: string;

  /**
   * A complexidade em si é validada no AuthService, via
   * `domain/services/password-policy`, para que a mensagem de erro liste
   * exatamente quais regras faltaram em vez de um "senha inválida" genérico.
   */
  @IsString()
  @MaxLength(128)
  @MinLength(8)
  novaSenha!: string;
}
