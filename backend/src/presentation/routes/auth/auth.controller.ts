import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "../../../application/dtos/login.dto";
import { SwitchCompanyDto } from "../../../application/dtos/switch-company.dto";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.senha);
  }

  @Post("switch-company")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPERADMIN")
  switchCompany(@Req() req: Request, @Body() dto: SwitchCompanyDto) {
    const currentUser = (req as unknown as { user: { sub: string; email: string; role: string; clienteId: string | null } })
      .user;
    return this.auth.switchCompany(currentUser, dto.clienteId);
  }
}
