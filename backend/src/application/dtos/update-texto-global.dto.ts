import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateTextoGlobalDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  indice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  texto?: string;
}
