import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateSetorDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  nome?: string;
}
