import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateSetorDto {
  @IsInt()
  numero!: number;

  @IsString()
  @IsNotEmpty()
  nome!: string;
}
