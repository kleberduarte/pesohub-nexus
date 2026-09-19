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

  /** Restringe o usuário a uma única Loja (via Perfil dedicado a ela). Sem isso, ele enxerga todas as Lojas do Cliente. */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  lojaId?: string;
}
