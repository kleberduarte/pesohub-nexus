import { Body, Controller, Post, Get, HttpCode, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RedefinicaoSenhaService } from "./redefinicao-senha.service";
import { setAuthCookie, clearAuthCookie } from "./auth-cookie";
import { LoginDto } from "../../../application/dtos/login.dto";
import { SwitchCompanyDto } from "../../../application/dtos/switch-company.dto";
import { SwitchLojaDto } from "../../../application/dtos/switch-loja.dto";
import { TrocarSenhaDto } from "../../../application/dtos/trocar-senha.dto";
import { EsqueciSenhaDto, RedefinirSenhaDto } from "../../../application/dtos/redefinir-senha.dto";
import { Public } from "../../middleware/public.decorator";
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
    private readonly redefinicao: RedefinicaoSenhaService,
    private readonly sessions: SessionRevocationService,
    private readonly auditLog: AuditLogService,
  ) {}

  // Pública por definição: é aqui que a sessão nasce.
  @Public()
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
  async refresh(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user } = await this.auth.refresh(req.user);
    setAuthCookie(res, accessToken);
    return { user };
  }

  /**
   * Resposta idêntica exista o e-mail ou não — do contrário a rota vira um
   * enumerador de contas. Throttle apertado: cada chamada pode disparar um
   * e-mail, e sem limite ela vira ferramenta para encher a caixa de alguém.
   */
  @Public()
  @Post("esqueci-senha")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async esqueciSenha(@Body() dto: EsqueciSenhaDto, @Req() req: Request) {
    await this.redefinicao.solicitar(dto.email);
    await this.auditLog.record(req, "auth.esqueci_senha");
    return { ok: true };
  }

  @Public()
  @Post("redefinir-senha")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async redefinirSenha(@Body() dto: RedefinirSenhaDto, @Req() req: Request) {
    const user = await this.redefinicao.redefinir(dto.token, dto.novaSenha);
    // Rota pública: o guard não anexou usuário. Anexa o dono do link para a
    // trilha de auditoria atribuir a troca à pessoa certa.
    Object.assign(req, { user: { sub: user.id } });
    await this.auditLog.record(req, "auth.redefinir_senha");
    return { ok: true };
  }

  /** Convidado define a própria senha pelo link do e-mail (card #91). */
  @Public()
  @Post("aceitar-convite")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async aceitarConvite(@Body() dto: RedefinirSenhaDto, @Req() req: Request) {
    const user = await this.redefinicao.aceitarConvite(dto.token, dto.novaSenha);
    Object.assign(req, { user: { sub: user.id } });
    await this.auditLog.record(req, "auth.aceitar_convite");
    return { ok: true };
  }

  @Post("trocar-senha")
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
  @UseGuards(RolesGuard)
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
  async switchLoja(@Req() req: AuthenticatedRequest, @Body() dto: SwitchLojaDto) {
    const { user } = await this.auth.switchLoja(req.user, dto.lojaId);
    await this.auditLog.record(req, "auth.switch_loja", { lojaId: dto.lojaId });
    return { user };
  }

  @Post("logout")
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    // Apagar o cookie não basta: quem já tiver uma cópia do token continuaria
    // autenticado até ele expirar. A revogação encerra a sessão de verdade.
    await this.auditLog.record(req, "auth.logout");
    await this.sessions.revoke(req.user.jti, req.user.exp, "logout");
    clearAuthCookie(res);
    return { ok: true };
  }

  @Get("me")
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
