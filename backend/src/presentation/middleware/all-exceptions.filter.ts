import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";

/**
 * Sem um filtro global, qualquer erro não-HTTP (falha do Prisma, corpo de erro
 * cru do Asaas/Veltrix, stack trace) vaza pro cliente na resposta 500 — nomes
 * de tabela, connection string e detalhes de integração inclusos. Aqui, tudo
 * que não é uma HttpException deliberada vira uma 500 genérica; o erro real
 * vai só pro log do servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) this.logger.error(exception.message, exception.stack);
      res.status(status).json(exception.getResponse());
      return;
    }

    const err = exception as Error;
    this.logger.error(`Erro não tratado: ${err?.message}`, err?.stack);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Erro interno do servidor",
    });
  }
}
