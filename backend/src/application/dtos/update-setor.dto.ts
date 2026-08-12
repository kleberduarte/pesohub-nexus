import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateSetorDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;
}
