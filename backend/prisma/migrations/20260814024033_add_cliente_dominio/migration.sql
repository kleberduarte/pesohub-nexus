-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN "dominio" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_dominio_key" ON "Cliente"("dominio");
