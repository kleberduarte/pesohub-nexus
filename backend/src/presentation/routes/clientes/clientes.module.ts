import { Module } from "@nestjs/common";
import { ClientesController } from "./clientes.controller";
import { ClientesPublicController } from "./clientes-public.controller";

@Module({
  controllers: [ClientesController, ClientesPublicController],
})
export class ClientesModule {}
