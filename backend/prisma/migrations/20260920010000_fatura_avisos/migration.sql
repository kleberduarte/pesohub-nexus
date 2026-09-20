-- Card #99: avisos de cobrança por e-mail, marcados por fatura para não repetir.
ALTER TABLE "Fatura" ADD COLUMN "avisoGeradaEm" TIMESTAMP(3);
ALTER TABLE "Fatura" ADD COLUMN "avisoPreVencimento" TIMESTAMP(3);
ALTER TABLE "Fatura" ADD COLUMN "avisoVencidaEm" TIMESTAMP(3);
