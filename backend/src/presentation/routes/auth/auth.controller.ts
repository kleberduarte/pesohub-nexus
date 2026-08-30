import { Body, Controller, Post, Get, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { setAuthCookie, clearAuthCookie } from "./auth-cookie";
import { LoginDto } from "../../../application/dtos/login.dto";
import { SwitchCompanyDto } from "../../../application/dtos/switch-company.dto";
import { SwitchLojaDto } from "../../../application/dtos/switch-loja.dto";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { SessionRevocationService } from "../../../infrastructure/auth/session-revocation.service";

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
    clienteId: string | null;
    lojaId: string | null;
    scoped?: boolean;
    jti?: string;
    exp?: number;
  };
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionRevocationService,
  ) {}

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
    // O token anterior aponta para a empresa antiga e continuaria válido até
    // expirar; trocar de empresa tem que aposentá-lo.
    await this.sessions.revoke(req.user.jti, req.user.exp);
    setAuthCookie(res, accessToken);
    return { user };
  }

  @Post("switch-loja")
  @UseGuards(JwtAuthGuard)
  async switchLoja(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SwitchLojaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } = await this.auth.switchLoja(req.user, dto.lojaId);
    await this.sessions.revoke(req.user.jti, req.user.exp);
    setAuthCookie(res, accessToken);
    return { user };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    // Apagar o cookie não basta: quem já tiver uma cópia do token continuaria
    // autenticado até ele expirar. A revogação encerra a sessão de verdade.
    await this.sessions.revoke(req.user.jti, req.user.exp);
    clearAuthCookie(res);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
