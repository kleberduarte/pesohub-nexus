import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { PrismaModule } from "./infrastructure/database/prisma.module";
import { AuditLogModule } from "./infrastructure/audit/audit-log.module";
import { DevicesModule } from "./presentation/routes/devices/devices.module";
import { ProductsModule } from "./presentation/routes/products/products.module";
import { SyncModule } from "./presentation/routes/sync/sync.module";
import { AuthModule } from "./presentation/routes/auth/auth.module";
import { RealtimeModule } from "./infrastructure/realtime/realtime.module";
import { ClientesModule } from "./presentation/routes/clientes/clientes.module";
import { UsersModule } from "./presentation/routes/users/users.module";
import { AgentsModule } from "./presentation/routes/agents/agents.module";
import { SetoresModule } from "./presentation/routes/setores/setores.module";
import { SubSetoresModule } from "./presentation/routes/sub-setores/sub-setores.module";
import { FornecedoresModule } from "./presentation/routes/fornecedores/fornecedores.module";
import { AlergicosModule } from "./presentation/routes/alergicos/alergicos.module";
import { TabelasNutricionaisModule } from "./presentation/routes/tabelas-nutricionais/tabelas-nutricionais.module";
import { OperadoresModule } from "./presentation/routes/operadores/operadores.module";
import { ImagensModule } from "./presentation/routes/imagens/imagens.module";
import { FormatosImpressaoModule } from "./presentation/routes/formatos-impressao/formatos-impressao.module";
import { CodigosBarrasFormatoModule } from "./presentation/routes/codigos-barras-formato/codigos-barras-formato.module";
import { TextosGlobaisModule } from "./presentation/routes/textos-globais/textos-globais.module";
import { TeclasAcessoRapidoModule } from "./presentation/routes/teclas-acesso-rapido/teclas-acesso-rapido.module";
import { SpecParametrosModule } from "./presentation/routes/spec-parametros/spec-parametros.module";
import { ConfiguracaoAvancadaModule } from "./presentation/routes/configuracao-avancada/configuracao-avancada.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
        redact: ["req.headers.authorization"],
        autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
      },
    }),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    DevicesModule,
    ProductsModule,
    SyncModule,
    RealtimeModule,
    ClientesModule,
    UsersModule,
    AgentsModule,
    SetoresModule,
    SubSetoresModule,
    FornecedoresModule,
    AlergicosModule,
    TabelasNutricionaisModule,
    OperadoresModule,
    ImagensModule,
    FormatosImpressaoModule,
    CodigosBarrasFormatoModule,
    TextosGlobaisModule,
    TeclasAcessoRapidoModule,
    SpecParametrosModule,
    ConfiguracaoAvancadaModule,
  ],
})
export class AppModule {}
