import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { ContratoService } from "./contrato.service";
import { AsaasService } from "../../../infrastructure/billing/asaas.service";

@Module({
  controllers: [BillingController],
  providers: [BillingService, ContratoService, AsaasService],
  exports: [BillingService, ContratoService],
})
export class BillingModule {}
