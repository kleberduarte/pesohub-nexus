import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { ContratoService } from "./contrato.service";
import { PainelService } from "./painel.service";
import { AvisosCobrancaService } from "./avisos-cobranca.service";
import { AsaasService } from "../../../infrastructure/billing/asaas.service";

@Module({
  controllers: [BillingController],
  providers: [BillingService, ContratoService, PainelService, AvisosCobrancaService, AsaasService],
  exports: [BillingService, ContratoService, PainelService, AvisosCobrancaService],
})
export class BillingModule {}
