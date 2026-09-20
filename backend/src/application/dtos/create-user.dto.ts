import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";
import { UserRole } from "@prisma/client";

export class CreateUserDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;

  /**
   * Convite por e-mail (card #91): a pessoa define a própria senha pelo link e
   * `senha` não é enviada. Sem convite, o administrador define a primeira
   * senha — caminho mantido para lojas sem e-mail confiável.
   */
  @IsOptional()
  @IsBoolean()
  convidar?: boolean;

  @ValidateIf((dto: CreateUserDto) => !dto.convidar)
  @IsString()
  @MaxLength(128)
  @MinLength(6)
  senha?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  /**
   * Escopo do usuário: o Perfil define a quais Lojas ele tem acesso. Sem
   * Perfil, ele enxerga todas as Lojas da empresa (card #83).
   */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  perfilId?: string;

  /**
   * Atalho antigo: restringe a uma única Loja criando um Perfil dedicado a
   * ela. Mantido por compatibilidade com quem já chama assim; `perfilId`
   * explícito tem precedência.
   */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  lojaId?: string;
}
