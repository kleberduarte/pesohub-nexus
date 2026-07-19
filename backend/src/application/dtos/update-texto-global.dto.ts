import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateTextoGlobalDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  indice?: number;

  @IsOptional()
  @IsString()
  texto?: string;
}
