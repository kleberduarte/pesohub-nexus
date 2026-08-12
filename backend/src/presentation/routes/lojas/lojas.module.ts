import { Module } from "@nestjs/common";
import { LojasController } from "./lojas.controller";

@Module({
  controllers: [LojasController],
})
export class LojasModule {}
