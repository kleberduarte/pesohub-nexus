import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { Request, Response, NextFunction } from "express";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./presentation/middleware/all-exceptions.filter";
import express from "express";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * O cookie de sessão usa SameSite=None em produção (necessário enquanto
 * frontend e backend vivem em domínios diferentes — ver auth-cookie.ts), o
 * que desliga a proteção contra CSRF que SameSite=Strict/Lax dava. Como
 * reposição, exigimos que requisições que mudam estado venham de uma origem
 * na allowlist. Browsers sempre mandam Origin em requisições cross-site;
 * ausência de Origin só ocorre em chamadas não-browser (curl, etc), que não
 * são o vetor de CSRF.
 */
function csrfOriginGuard(corsOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!STATE_CHANGING_METHODS.has(req.method)) return next();
    const origin = req.headers.origin;
    if (!origin) return next();
    if (corsOrigins.includes(origin)) return next();
    res.status(403).json({ statusCode: 403, message: "Origem não autorizada" });
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  // Em produção a aplicação roda atrás do proxy do Railway. Sem `trust proxy`,
  // o Express enxerga o IP do proxy em TODA requisição — o ThrottlerGuard
  // então joga o mundo inteiro no mesmo balde: os 100 req/min viram um teto
  // global (auto-DoS no primeiro pico real) e o limite de 5 tentativas de
  // login por minuto passa a ser compartilhado, deixando um único atacante
  // trancar o login de todos os clientes. Com isso ligado, cada limite volta
  // a valer por IP real (X-Forwarded-For).
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.enableShutdownHooks();
  app.use(helmet());
  app.use(cookieParser());
  // Teto explícito no corpo da requisição: o import em massa de balanças aceita
  // até 5000 linhas, e sem um limite declarado o default do Express (100kb)
  // rejeitava lotes grandes enquanto qualquer outra rota ficava sem proteção
  // contra corpos gigantes.
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.use(csrfOriginGuard(corsOrigins));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix("api/v1");

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("PesoHub API")
      .setDescription("Plataforma de Gestão Remota de Balanças")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
