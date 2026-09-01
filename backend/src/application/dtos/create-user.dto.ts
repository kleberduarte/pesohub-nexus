import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";

export class CreateUserDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MaxLength(128)
  @MinLength(6)
  senha!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  /** Restringe o usuário a uma única Loja (via Perfil dedicado a ela). Sem isso, ele enxerga todas as Lojas do Cliente. */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  lojaId?: string;
}
