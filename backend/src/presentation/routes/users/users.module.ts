import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { ConviteService } from "./convite.service";

@Module({
  controllers: [UsersController],
  providers: [ConviteService],
})
export class UsersModule {}
