import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePerfilDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lojaIds?: string[];
}
