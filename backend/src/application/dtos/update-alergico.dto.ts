import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateAlergicoDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  informacao?: string;
}
