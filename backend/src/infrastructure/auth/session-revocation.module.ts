import { Global, Module } from "@nestjs/common";
import { SessionRevocationService } from "./session-revocation.service";
import { SessionScopeService } from "./session-scope.service";

/**
 * Global porque o JwtAuthGuard é instanciado em praticamente todos os módulos
 * de rota — o mesmo motivo pelo qual o PrismaModule é global.
 */
@Global()
@Module({
  providers: [SessionRevocationService, SessionScopeService],
  exports: [SessionRevocationService, SessionScopeService],
})
export class SessionRevocationModule {}
