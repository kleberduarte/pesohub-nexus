import { IsString } from "class-validator";

export class SwitchLojaDto {
  @IsString()
  lojaId!: string;
}
