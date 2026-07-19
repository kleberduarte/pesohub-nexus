import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateAlergicoDto {
  @IsOptional()
  @IsInt()
  numero?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  informacao?: string;
}
