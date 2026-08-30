-- Passa a guardar apenas o hash SHA-256 do token do Agent Local.
--
-- Os agentes já instalados em campo NÃO precisam ser reprovisionados: o hash é
-- calculado a partir do token que já está na tabela, então cada agente segue
-- conectando com o mesmo AGENT_TOKEN que tem hoje. sha256() é nativo do
-- Postgres desde a versão 11, não exige pgcrypto.
ALTER TABLE "Agent" ADD COLUMN "tokenHash" TEXT;

UPDATE "Agent" SET "tokenHash" = encode(sha256("token"::bytea), 'hex');

ALTER TABLE "Agent" ALTER COLUMN "tokenHash" SET NOT NULL;

CREATE UNIQUE INDEX "Agent_tokenHash_key" ON "Agent"("tokenHash");

DROP INDEX IF EXISTS "Agent_token_key";

ALTER TABLE "Agent" DROP COLUMN "token";
