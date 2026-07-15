import { IsString } from "class-validator";

export class LinkAgentDto {
  @IsString()
  agentToken!: string;
}
