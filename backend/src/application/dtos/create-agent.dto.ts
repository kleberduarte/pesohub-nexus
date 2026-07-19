import { IsString, MinLength } from "class-validator";

export class CreateAgentDto {
  @IsString()
  @MinLength(1)
  lojaId!: string;
}
