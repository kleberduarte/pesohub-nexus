import { IsInt, IsString, Max, Min } from "class-validator";

export class CreateTextoGlobalDto {
  @IsInt()
  @Min(1)
  @Max(8)
  indice!: number;

  @IsString()
  texto!: string;
}
