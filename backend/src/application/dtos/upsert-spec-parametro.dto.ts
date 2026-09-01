import { IsInt, IsString, MaxLength } from "class-validator";

export class UpsertSpecParametroDto {
  @IsInt()
  numero!: number;

  @IsString()
  @MaxLength(60)
  valor!: string;
}
