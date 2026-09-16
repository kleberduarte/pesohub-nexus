-- O default cuid() do accessToken era a origem de tokens adivinháveis no link
-- público /acesso/:token: cuid é um contador monotônico com fingerprint de
-- máquina, não um segredo. Removido do schema para que criar um Cliente sem
-- gerar o token explicitamente vire um erro em vez de um vazamento silencioso.
--
-- No Postgres isto é um no-op: cuid() é gerado pelo Prisma Client, nunca virou
-- DEFAULT na coluna. A migração existe para manter o histórico alinhado com o
-- schema (e DROP DEFAULT em coluna sem default é válido e idempotente).
ALTER TABLE "Cliente" ALTER COLUMN "accessToken" DROP DEFAULT;
