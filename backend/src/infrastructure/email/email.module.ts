import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service";

/** Global: senha, convite e cobrança vivem em módulos diferentes e todos enviam e-mail. */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
