import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { Public } from "../../middleware/public.decorator";

@ApiTags("health")
@Controller("health")
@Public()
// Era @SkipThrottle(): sem teto nenhum, e cada chamada abre uma consulta ao
// Postgres. Isso fazia da rota mais barata da API um amplificador anônimo de
// carga contra o pool de conexões. 60/min por IP deixa o healthcheck do
// Railway (a cada 30s) com folga de uma ordem de grandeza.
@Throttle({ default: { ttl: 60000, limit: 60 } })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Healthcheck do Railway: precisa responder antes de existir sessão.
  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  }
}
