import { Body, Controller, Post, Get, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { setAuthCookie, clearAuthCookie } from "./auth-cookie";
import { LoginDto } from "../../../application/dtos/login.dto";
import { SwitchCompanyDto } from "../../../application/dtos/switch-company.dto";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";

type AuthenticatedRequest = Request & {
  user: { sub: string; email: string; role: string; clienteId: string | null };
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user } = await this.auth.login(dto.email, dto.senha);
    setAuthCookie(res, accessToken);
    return { user };
  }

  @Post("switch-company")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPERADMIN")
  async switchCompany(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SwitchCompanyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } = await this.auth.switchCompany(req.user, dto.clienteId);
    setAuthCookie(res, accessToken);
    return { user };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
