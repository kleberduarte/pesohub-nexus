import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CreateDeviceUseCase } from "../../../application/usecases/create-device.usecase";
import { LinkDeviceAgentUseCase } from "../../../application/usecases/link-device-agent.usecase";
import { BulkImportDevicesUseCase } from "../../../application/usecases/bulk-import-devices.usecase";
import { CreateDeviceDto } from "../../../application/dtos/create-device.dto";
import { UpdateDeviceDto } from "../../../application/dtos/update-device.dto";
import { LinkAgentDto } from "../../../application/dtos/link-agent.dto";
import { ImportDevicesDto } from "../../../application/dtos/import-devices.dto";
import { DEVICE_REPOSITORY, DeviceRepository } from "../../../domain/repositories/device.repository";
import { AgentGateway } from "../../../infrastructure/realtime/agent.gateway";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { AuditLogService } from "../../../infrastructure/audit/audit-log.service";

@ApiTags("devices")
@UseGuards(JwtAuthGuard)
@Controller("devices")
export class DevicesController {
  constructor(
    private readonly createDevice: CreateDeviceUseCase,
    private readonly linkDeviceAgent: LinkDeviceAgentUseCase,
    private readonly bulkImportDevices: BulkImportDevicesUseCase,
    @Inject(DEVICE_REPOSITORY) private readonly devices: DeviceRepository,
    private readonly agentGateway: AgentGateway,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.devices.findAll(this.lojaId(req));
  }

  @Get("discovered")
  async findDiscovered(@Req() req: Request) {
    const discovered = this.agentGateway.getDiscoveredDevices(this.clienteId(req));
    const registered = await this.devices.findAll(this.lojaId(req));
    const registeredIps = new Set(registered.map((d) => d.ip));
    return discovered.filter((d) => !registeredIps.has(d.ip));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    return this.devices.findById(id, this.lojaId(req));
  }

  @Post()
  create(@Body() dto: CreateDeviceDto, @Req() req: Request) {
    return this.createDevice.execute(this.clienteId(req), this.lojaId(req), dto);
  }

  @Post("import")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  async import(@Body() dto: ImportDevicesDto, @Req() req: Request) {
    const result = await this.bulkImportDevices.execute(this.clienteId(req), dto.rows);
    await this.auditLog.record(req, "device.bulk_import", {
      lojas: result.length,
      devices: dto.rows.length,
    });
    return result;
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDeviceDto, @Req() req: Request) {
    return this.devices.update(id, this.lojaId(req), dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.devices.delete(id, this.lojaId(req));
  }

  @Post(":id/link-agent")
  linkAgent(@Param("id") id: string, @Body() dto: LinkAgentDto, @Req() req: Request) {
    return this.linkDeviceAgent.execute(id, this.lojaId(req), dto.agentToken);
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }

  private lojaId(req: Request): string {
    return (req as unknown as { user: { lojaId: string } }).user.lojaId;
  }
}
