import { IsString, Length } from "class-validator";

export class CreateClienteDto {
  @IsString()
  @Length(3, 200)
  nome!: string;
}
