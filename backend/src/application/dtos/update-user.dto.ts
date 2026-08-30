import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @MinLength(6)
  senha?: string;
}
