import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateDeviceUseCase } from "../../../application/usecases/create-device.usecase";
import { CreateDeviceDto } from "../../../application/dtos/create-device.dto";
import { DEVICE_REPOSITORY, DeviceRepository } from "../../../domain/repositories/device.repository";
import { Inject } from "@nestjs/common";

@ApiTags("devices")
@Controller("devices")
export class DevicesController {
  constructor(
    private readonly createDevice: CreateDeviceUseCase,
    @Inject(DEVICE_REPOSITORY) private readonly devices: DeviceRepository,
  ) {}

  @Get()
  findAll() {
    return this.devices.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.devices.findById(id);
  }

  @Post()
  create(@Body() dto: CreateDeviceDto) {
    return this.createDevice.execute(dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.devices.delete(id);
  }
}
