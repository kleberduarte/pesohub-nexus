import { Module } from "@nestjs/common";
import { SyncController } from "./sync.controller";
import { SyncQueueModule } from "../../../infrastructure/queue/sync-queue.module";
import { DevicesModule } from "../devices/devices.module";

@Module({
  imports: [SyncQueueModule, DevicesModule],
  controllers: [SyncController],
})
export class SyncModule {}
