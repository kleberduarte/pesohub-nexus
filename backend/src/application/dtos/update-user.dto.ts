import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  /**
   * Escopo de lojas do usuário (card #84). String vazia limpa o Perfil, que
   * significa "todas as lojas" — por isso limpar é privilégio de quem já
   * administra a empresa inteira, checado no controller.
   */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  perfilId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @MinLength(6)
  senha?: string;
}
