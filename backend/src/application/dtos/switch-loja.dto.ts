import { IsString, MaxLength } from "class-validator";

export class SwitchLojaDto {
  @IsString()
  @MaxLength(128)
  lojaId!: string;
}
