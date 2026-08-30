import { IsString, MaxLength } from "class-validator";

export class LinkAgentDto {
  @IsString()
  @MaxLength(128)
  agentToken!: string;
}
