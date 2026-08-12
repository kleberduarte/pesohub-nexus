import { Module } from "@nestjs/common";
import { PerfisController } from "./perfis.controller";

@Module({
  controllers: [PerfisController],
})
export class PerfisModule {}
