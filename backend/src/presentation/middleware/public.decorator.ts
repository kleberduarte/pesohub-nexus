import { SetMetadata } from "@nestjs/common";

/**
 * Marca uma rota como acessível sem sessão.
 *
 * O JwtAuthGuard é global (ver AppModule): toda rota nasce fechada, e só sai
 * dessa condição com este decorator explícito. O padrão anterior era o
 * inverso — o guard era declarado controller a controller, e esquecer o
 * `@UseGuards` num controller novo o publicava para a internet em silêncio.
 *
 * Cada uso aqui é uma decisão de segurança e precisa se justificar: ou a rota
 * é onde a autenticação nasce (login), ou ela tem um mecanismo de
 * autenticação próprio (token de webhook, token de link público).
 */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
