import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateDeviceUseCase } from "../../../application/usecases/create-device.usecase";
import { LinkDeviceAgentUseCase } from "../../../application/usecases/link-device-agent.usecase";
import { CreateDeviceDto } from "../../../application/dtos/create-device.dto";
import { UpdateDeviceDto } from "../../../application/dtos/update-device.dto";
import { LinkAgentDto } from "../../../application/dtos/link-agent.dto";
import { DEVICE_REPOSITORY, DeviceRepository } from "../../../domain/repositories/device.repository";
import { AgentGateway } from "../../../infrastructure/realtime/agent.gateway";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";

@ApiTags("devices")
@UseGuards(JwtAuthGuard)
@Controller("devices")
export class DevicesController {
  constructor(
    private readonly createDevice: CreateDeviceUseCase,
    private readonly linkDeviceAgent: LinkDeviceAgentUseCase,
    @Inject(DEVICE_REPOSITORY) private readonly devices: DeviceRepository,
    private readonly agentGateway: AgentGateway,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.devices.findAll(this.clienteId(req));
  }

  @Get("discovered")
  async findDiscovered(@Req() req: Request) {
    const discovered = this.agentGateway.getDiscoveredDevices(this.clienteId(req));
    const registered = await this.devices.findAll(this.clienteId(req));
    const registeredIps = new Set(registered.map((d) => d.ip));
    return discovered.filter((d) => !registeredIps.has(d.ip));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.devices.findById(id, this.clienteId(req));
  }

  @Post()
  create(@Body() dto: CreateDeviceDto, @Req() req: Request) {
    return this.createDevice.execute(this.clienteId(req), dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDeviceDto, @Req() req: Request) {
    return this.devices.update(id, this.clienteId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.devices.delete(id, this.clienteId(req));
  }

  @Post(":id/link-agent")
  linkAgent(@Param("id") id: string, @Body() dto: LinkAgentDto, @Req() req: Request) {
    return this.linkDeviceAgent.execute(id, this.clienteId(req), dto.agentToken);
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
