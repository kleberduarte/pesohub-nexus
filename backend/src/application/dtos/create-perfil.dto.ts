import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePerfilDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lojaIds?: string[];
}
