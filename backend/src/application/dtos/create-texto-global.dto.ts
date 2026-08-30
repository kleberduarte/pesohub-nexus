import { IsInt, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateTextoGlobalDto {
  @IsInt()
  @Min(1)
  @Max(8)
  indice!: number;

  @IsString()
  @MaxLength(255)
  texto!: string;
}
