import { Body, Controller, Get, Headers, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { BillingService } from "./billing.service";
import { CreateAssinaturaDto } from "../../../application/dtos/create-assinatura.dto";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { SkipBillingCheck } from "../../middleware/skip-billing-check.decorator";

@ApiTags("billing")
@SkipBillingCheck()
@Controller("billing")
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly config: ConfigService,
  ) {}

  @Post("subscribe")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  subscribe(@Body() dto: CreateAssinaturaDto, @Req() req: Request) {
    return this.billing.subscribe(this.clienteId(req), dto);
  }

  @Get("status")
  @UseGuards(JwtAuthGuard)
  status(@Req() req: Request) {
    return this.billing.status(this.clienteId(req));
  }

  @Post("cancel")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  cancel(@Req() req: Request) {
    return this.billing.cancel(this.clienteId(req));
  }

  @Post("webhook")
  async webhook(@Body() body: { event: string; payment: Record<string, any> }, @Headers("asaas-access-token") token: string) {
    const expected = this.config.get<string>("ASAAS_WEBHOOK_TOKEN");
    if (expected && token !== expected) {
      throw new UnauthorizedException("Token de webhook inválido");
    }

    await this.billing.handleWebhookEvent(body.event, body.payment);
    return { received: true };
  }

  private clienteId(req: Request): string {
    return (req as unknown as { user: { clienteId: string } }).user.clienteId;
  }
}
