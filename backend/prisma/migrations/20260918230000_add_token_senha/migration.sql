-- Cards #90 e #91: links de uso único para redefinir senha e aceitar convite.
-- Só o hash do token é gravado. Tabela nova e independente: nenhuma linha
-- existente é tocada.
CREATE TYPE "TipoTokenSenha" AS ENUM ('REDEFINICAO', 'CONVITE');

CREATE TABLE "TokenSenha" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoTokenSenha" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenSenha_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TokenSenha_tokenHash_key" ON "TokenSenha"("tokenHash");
CREATE INDEX "TokenSenha_userId_tipo_idx" ON "TokenSenha"("userId", "tipo");

ALTER TABLE "TokenSenha" ADD CONSTRAINT "TokenSenha_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
