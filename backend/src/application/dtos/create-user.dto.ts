import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  senha!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  /** Restringe o usuário a uma única Loja (via Perfil dedicado a ela). Sem isso, ele enxerga todas as Lojas do Cliente. */
  @IsOptional()
  @IsString()
  lojaId?: string;
}
