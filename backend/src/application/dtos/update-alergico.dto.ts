import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateAlergicoDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  informacao?: string;
}
