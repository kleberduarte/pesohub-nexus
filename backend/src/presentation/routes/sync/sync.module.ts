import { Module } from "@nestjs/common";
import { SyncController } from "./sync.controller";
import { SyncQueueModule } from "../../../infrastructure/queue/sync-queue.module";

@Module({
  imports: [SyncQueueModule],
  controllers: [SyncController],
})
export class SyncModule {}
