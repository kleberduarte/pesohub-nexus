import { Module } from "@nestjs/common";
import { DevicesController } from "./devices.controller";
import { CreateDeviceUseCase } from "../../../application/usecases/create-device.usecase";
import { LinkDeviceAgentUseCase } from "../../../application/usecases/link-device-agent.usecase";
import { DEVICE_REPOSITORY } from "../../../domain/repositories/device.repository";
import { DevicePrismaRepository } from "../../../infrastructure/database/device.prisma.repository";
import { RealtimeModule } from "../../../infrastructure/realtime/realtime.module";

@Module({
  imports: [RealtimeModule],
  controllers: [DevicesController],
  providers: [
    CreateDeviceUseCase,
    LinkDeviceAgentUseCase,
    { provide: DEVICE_REPOSITORY, useClass: DevicePrismaRepository },
  ],
  exports: [DEVICE_REPOSITORY],
})
export class DevicesModule {}
