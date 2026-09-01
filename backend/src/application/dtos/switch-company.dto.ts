import { IsString, MaxLength } from "class-validator";

export class SwitchCompanyDto {
  @IsString()
  @MaxLength(128)
  clienteId!: string;
}
