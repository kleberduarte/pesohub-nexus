import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { AsaasService } from "../../../infrastructure/billing/asaas.service";

@Module({
  controllers: [BillingController],
  providers: [BillingService, AsaasService],
  exports: [BillingService],
})
export class BillingModule {}
