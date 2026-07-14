import { Module } from "@nestjs/common";
import { DevicesController } from "./devices.controller";
import { CreateDeviceUseCase } from "../../../application/usecases/create-device.usecase";
import { DEVICE_REPOSITORY } from "../../../domain/repositories/device.repository";
import { DevicePrismaRepository } from "../../../infrastructure/database/device.prisma.repository";
import { RealtimeModule } from "../../../infrastructure/realtime/realtime.module";

@Module({
  imports: [RealtimeModule],
  controllers: [DevicesController],
  providers: [
    CreateDeviceUseCase,
    { provide: DEVICE_REPOSITORY, useClass: DevicePrismaRepository },
  ],
})
export class DevicesModule {}
