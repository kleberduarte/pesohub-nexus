import { INestApplication } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { JwtAuthGuard } from "../middleware/jwt-auth.guard";
import { SessionScopeService } from "../../infrastructure/auth/session-scope.service";
import { SessionRevocationService } from "../../infrastructure/auth/session-revocation.service";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { AuditLogService } from "../../infrastructure/audit/audit-log.service";
import { UsersController } from "./users/users.controller";
import { ConviteService } from "./users/convite.service";

/**
 * Card #88 — isolamento entre lojas, verificado por HTTP DIRETO.
 *
 * Isolamento é exatamente o tipo de coisa que "parece funcionar" na tela e
 * vaza por baixo: a interface só oferece as lojas permitidas, mas o escopo
 * viaja num cabeçalho, e cabeçalho qualquer um forja com curl. Por isso este
 * teste sobe a aplicação de verdade, com o guard global montado, e ataca por
 * fetch com `x-pesohub-loja` apontando para a loja do concorrente.
 *
 * O que ele prova: a sessão do gerente da Loja 1 não alcança a Loja 2 nem
 * pelo cabeçalho, e a lista de usuários não devolve a equipe da outra loja.
 */
const SEGREDO = "segredo-de-teste-isolamento";

const LOJA_1 = "loja-1";
const LOJA_2 = "loja-2";

const usuarios: Record<string, { id: string; role: string; perfilId: string | null; clienteId: string }> = {
  "gerente-1": { id: "gerente-1", role: "ADMIN", perfilId: "perfil-loja-1", clienteId: "cliente-a" },
};

/** Equipe das duas lojas, como o banco devolveria sem nenhum recorte. */
const equipeDaEmpresa = [
  {
    id: "gerente-1",
    email: "g1@rede.com.br",
    role: "ADMIN",
    createdAt: new Date(),
    perfilId: "perfil-loja-1",
    perfil: { nome: "Loja 1", lojas: [{ lojaId: LOJA_1 }] },
    lockedUntil: null,
    mustChangePassword: false,
    passwordChangedAt: null,
    tokensSenha: [],
  },
  {
    id: "op-da-loja-2",
    email: "op2@rede.com.br",
    role: "OPERADOR",
    createdAt: new Date(),
    perfilId: "perfil-loja-2",
    perfil: { nome: "Loja 2", lojas: [{ lojaId: LOJA_2 }] },
    lockedUntil: null,
    mustChangePassword: false,
    passwordChangedAt: null,
    tokensSenha: [],
  },
];

describe("Isolamento entre lojas (HTTP)", () => {
  let app: INestApplication;
  let url: string;
  let cookie: string;

  beforeAll(async () => {
    const prisma = {
      user: {
        findUnique: jest.fn(({ where }: { where: { id: string } }) => Promise.resolve(usuarios[where.id] ?? null)),
        findMany: jest.fn().mockResolvedValue(equipeDaEmpresa),
      },
      // As duas lojas existem e são da mesma empresa: o que separa uma da
      // outra é só o Perfil de quem pede.
      loja: {
        findFirst: jest.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve([LOJA_1, LOJA_2].includes(where.id) ? { id: where.id, clienteId: "cliente-a" } : null),
        ),
        // O guard consulta o domínio da loja para o bloqueio por inadimplência.
        findUnique: jest.fn().mockResolvedValue({ dominioEmail: null }),
      },
      perfilLojaAcesso: {
        findFirst: jest.fn(({ where }: { where: { perfilId: string; lojaId: string } }) =>
          Promise.resolve(where.perfilId === "perfil-loja-1" && where.lojaId === LOJA_1 ? { id: "a1" } : null),
        ),
        findMany: jest.fn().mockResolvedValue([{ lojaId: LOJA_1 }]),
      },
      assinatura: { findUnique: jest.fn().mockResolvedValue(null) },
      cliente: { findUnique: jest.fn().mockResolvedValue({ dominio: "rede.com.br" }) },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SEGREDO })],
      controllers: [UsersController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: { record: jest.fn() } },
        { provide: ConviteService, useValue: {} },
        {
          provide: SessionRevocationService,
          useValue: {
            motivoRevogacao: jest.fn().mockResolvedValue(null),
            expirouPorInatividade: jest.fn().mockResolvedValue(false),
            marcarAtividade: jest.fn().mockResolvedValue(undefined),
            revoke: jest.fn().mockResolvedValue(undefined),
          },
        },
        SessionScopeService,
        Reflector,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.listen(0);
    url = await app.getUrl();

    const jwt = app.get(JwtService);
    const token = jwt.sign({
      sub: "gerente-1",
      clienteId: "cliente-a",
      lojaId: LOJA_1,
      role: "ADMIN",
      perfilId: "perfil-loja-1",
      jti: "sessao-1",
    });
    cookie = `pesohub_session=${token}`;
  });

  afterAll(async () => {
    await app?.close();
  });

  const pedir = (caminho: string, lojaForjada?: string) =>
    fetch(`${url}${caminho}`, {
      headers: {
        cookie,
        ...(lojaForjada ? { "x-pesohub-loja": lojaForjada } : {}),
      },
    });

  it("sem cabeçalho forjado, a sessão da Loja 1 funciona normalmente", async () => {
    const res = await pedir("/users");
    expect(res.status).toBe(200);
  });

  // O ataque: a sessão é legítima, o cabeçalho é que mente.
  it("cabeçalho apontando para a loja do concorrente é RECUSADO", async () => {
    const res = await pedir("/users", LOJA_2);

    expect(res.status).toBe(403);
    const corpo = (await res.json()) as { message?: string };
    expect(corpo.message).toMatch(/fora do seu escopo/i);
  });

  // A falha pior não seria o 403 e sim o 200: responder os dados da Loja 1
  // como se fossem os da Loja 2, em silêncio.
  it("a recusa não devolve dados de loja nenhuma", async () => {
    const res = await pedir("/users", LOJA_2);
    const corpo = (await res.json()) as Record<string, unknown>;

    expect(Array.isArray(corpo)).toBe(false);
  });

  it("a lista de usuários não traz a equipe da outra loja", async () => {
    const res = await pedir("/users");
    const equipe = (await res.json()) as { id: string; email: string }[];

    expect(equipe.map((u) => u.id)).toEqual(["gerente-1"]);
    expect(JSON.stringify(equipe)).not.toContain("op2@rede.com.br");
  });

  it("sem sessão, nem chega ao escopo", async () => {
    const res = await fetch(`${url}/users`, { headers: { "x-pesohub-loja": LOJA_2 } });

    expect(res.status).toBe(401);
  });
});
