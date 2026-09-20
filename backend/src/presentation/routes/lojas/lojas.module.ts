import { Module } from "@nestjs/common";
import { LojasController } from "./lojas.controller";
import { BillingModule } from "../billing/billing.module";

@Module({
  // A criação de loja com domínio abre a assinatura da rede (card #99).
  imports: [BillingModule],
  controllers: [LojasController],
})
export class LojasModule {}
