import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./infrastructure/database/prisma.module";
import { DevicesModule } from "./presentation/routes/devices/devices.module";
import { ProductsModule } from "./presentation/routes/products/products.module";
import { SyncModule } from "./presentation/routes/sync/sync.module";
import { AuthModule } from "./presentation/routes/auth/auth.module";
import { RealtimeModule } from "./infrastructure/realtime/realtime.module";
import { ClientesModule } from "./presentation/routes/clientes/clientes.module";
import { UsersModule } from "./presentation/routes/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DevicesModule,
    ProductsModule,
    SyncModule,
    RealtimeModule,
    ClientesModule,
    UsersModule,
  ],
})
export class AppModule {}
