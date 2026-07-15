import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateDeviceUseCase } from "../../../application/usecases/create-device.usecase";
import { LinkDeviceAgentUseCase } from "../../../application/usecases/link-device-agent.usecase";
import { CreateDeviceDto } from "../../../application/dtos/create-device.dto";
import { LinkAgentDto } from "../../../application/dtos/link-agent.dto";
import { DEVICE_REPOSITORY, DeviceRepository } from "../../../domain/repositories/device.repository";
import { Inject } from "@nestjs/common";
import { AgentGateway } from "../../../infrastructure/realtime/agent.gateway";

@ApiTags("devices")
@Controller("devices")
export class DevicesController {
  constructor(
    private readonly createDevice: CreateDeviceUseCase,
    private readonly linkDeviceAgent: LinkDeviceAgentUseCase,
    @Inject(DEVICE_REPOSITORY) private readonly devices: DeviceRepository,
    private readonly agentGateway: AgentGateway,
  ) {}

  @Get()
  findAll() {
    return this.devices.findAll();
  }

  @Get("discovered")
  async findDiscovered() {
    const discovered = this.agentGateway.getDiscoveredDevices();
    const registered = await this.devices.findAll();
    const registeredIps = new Set(registered.map((d) => d.ip));
    return discovered.filter((d) => !registeredIps.has(d.ip));
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

  @Post(":id/link-agent")
  linkAgent(@Param("id") id: string, @Body() dto: LinkAgentDto) {
    return this.linkDeviceAgent.execute(id, dto.agentToken);
  }
}
