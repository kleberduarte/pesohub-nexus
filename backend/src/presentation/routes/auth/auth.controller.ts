import { Body, Controller, Post, Get, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { setAuthCookie, clearAuthCookie } from "./auth-cookie";
import { LoginDto } from "../../../application/dtos/login.dto";
import { SwitchCompanyDto } from "../../../application/dtos/switch-company.dto";
import { SwitchLojaDto } from "../../../application/dtos/switch-loja.dto";
import { TrocarSenhaDto } from "../../../application/dtos/trocar-senha.dto";
import { JwtAuthGuard } from "../../middleware/jwt-auth.guard";
import { RolesGuard } from "../../middleware/roles.guard";
import { Roles } from "../../middleware/roles.decorator";
import { SessionRevocationService } from "../../../infrastructure/auth/session-revocation.service";
import { AuditLogService } from "../../../infrastructure/audit/audit-log.service";

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
    private readonly auditLog: AuditLogService,
  ) {}

  @Post("login")
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user } = await this.auth.login(dto.email, dto.senha);
    setAuthCookie(res, accessToken);
    // Login é o evento mais importante da trilha: é o que amarra pessoa,
    // máquina e horário. O guard não rodou aqui (login é rota pública), então
    // o `user` recém-resolvido é anexado à request para o audit log encontrar.
    Object.assign(req, { user });
    await this.auditLog.record(req, "auth.login", { email: dto.email });
    return { user };
  }

  /**
   * Renova a sessão por atividade. O frontend chama enquanto a pessoa está
   * usando o sistema; parar de chamar é o que deixa a sessão expirar.
   */
  @Post("refresh")
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user } = await this.auth.refresh(req.user);
    setAuthCookie(res, accessToken);
    return { user };
  }

  @Post("trocar-senha")
  @UseGuards(JwtAuthGuard)
  async trocarSenha(
    @Req() req: AuthenticatedRequest,
    @Body() dto: TrocarSenhaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } = await this.auth.trocarSenha(req.user, dto.senhaAtual, dto.novaSenha);
    setAuthCookie(res, accessToken);
    await this.auditLog.record(req, "auth.trocar_senha");
    return { user };
  }

  @Post("switch-company")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPERADMIN")
  async switchCompany(@Req() req: AuthenticatedRequest, @Body() dto: SwitchCompanyDto) {
    // Sem cookie novo: a empresa ativa é escopo desta aba, e reemitir o cookie
    // arrastaria as outras abas junto. A aba guarda o escopo devolvido aqui e
    // passa a enviá-lo no cabeçalho, revalidado a cada requisição.
    const { user } = await this.auth.switchCompany(req.user, dto.clienteId);
    await this.auditLog.record(req, "auth.switch_company", { clienteId: dto.clienteId });
    return { user };
  }

  @Post("switch-loja")
  @UseGuards(JwtAuthGuard)
  async switchLoja(@Req() req: AuthenticatedRequest, @Body() dto: SwitchLojaDto) {
    const { user } = await this.auth.switchLoja(req.user, dto.lojaId);
    await this.auditLog.record(req, "auth.switch_loja", { lojaId: dto.lojaId });
    return { user };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    // Apagar o cookie não basta: quem já tiver uma cópia do token continuaria
    // autenticado até ele expirar. A revogação encerra a sessão de verdade.
    await this.auditLog.record(req, "auth.logout");
    await this.sessions.revoke(req.user.jti, req.user.exp, "logout");
    clearAuthCookie(res);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
