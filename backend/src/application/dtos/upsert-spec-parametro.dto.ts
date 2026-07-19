import { IsInt, IsString } from "class-validator";

export class UpsertSpecParametroDto {
  @IsInt()
  numero!: number;

  @IsString()
  valor!: string;
}
