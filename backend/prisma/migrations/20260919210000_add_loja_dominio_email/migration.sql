-- Card #96: domínio de e-mail por loja (rede de supermercado)
ALTER TABLE "Loja" ADD COLUMN "dominioEmail" TEXT;
CREATE INDEX "Loja_clienteId_dominioEmail_idx" ON "Loja"("clienteId", "dominioEmail");
