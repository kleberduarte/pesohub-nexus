import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateAgentDto {
  @IsString()
  @MaxLength(128)
  @MinLength(1)
  lojaId!: string;
}
