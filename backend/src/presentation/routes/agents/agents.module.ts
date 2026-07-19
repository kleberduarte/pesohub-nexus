import { Module } from "@nestjs/common";
import { AgentsController } from "./agents.controller";
import { CreateAgentUseCase } from "../../../application/usecases/create-agent.usecase";

@Module({
  controllers: [AgentsController],
  providers: [CreateAgentUseCase],
})
export class AgentsModule {}
