import { IsInt, IsString } from "class-validator";

export class CreateSetorDto {
  @IsInt()
  numero!: number;

  @IsString()
  nome!: string;
}
