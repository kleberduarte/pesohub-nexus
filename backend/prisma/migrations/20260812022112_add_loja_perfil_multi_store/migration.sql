-- DropIndex
DROP INDEX "Alergico_clienteId_numero_key";

-- DropIndex
DROP INDEX "CodigoBarrasFormato_clienteId_numero_key";

-- DropIndex
DROP INDEX "ConfiguracaoAvancada_clienteId_key";

-- DropIndex
DROP INDEX "FormatoImpressao_clienteId_numero_key";

-- DropIndex
DROP INDEX "Fornecedor_clienteId_numero_key";

-- DropIndex
DROP INDEX "Operador_clienteId_numero_key";

-- DropIndex
DROP INDEX "Product_clienteId_codigoBarras_key";

-- DropIndex
DROP INDEX "Product_clienteId_codigo_key";

-- DropIndex
DROP INDEX "Setor_clienteId_numero_key";

-- DropIndex
DROP INDEX "SpecParametro_clienteId_numero_key";

-- DropIndex
DROP INDEX "SubSetor_clienteId_numero_key";

-- DropIndex
DROP INDEX "TabelaNutricional_clienteId_numero_key";

-- DropIndex
DROP INDEX "TextoGlobal_clienteId_indice_key";

-- AlterTable (add nullable first, backfill below, then enforce NOT NULL)
ALTER TABLE "Alergico" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "CodigoBarrasFormato" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "ConfiguracaoAvancada" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "DeviceGroup" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
-- Agent already has a legacy free-text "lojaId" column (store label, e.g. "Assai Loja 01").
-- Preserve it under a temp name so its values become the real Loja.nome below,
-- then repoint "lojaId" to the new Loja relation.
ALTER TABLE "Agent" RENAME COLUMN "lojaId" TO "_legacyLojaLabel";
ALTER TABLE "Agent" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "FormatoImpressao" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "Fornecedor" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "Imagem" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "Operador" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "Setor" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "SpecParametro" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "SubSetor" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "TabelaNutricional" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "TeclaAcessoRapido" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "TextoGlobal" ADD COLUMN     "lojaId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeLojaId" TEXT,
ADD COLUMN     "perfilId" TEXT;

-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "responsavel" TEXT,
    "email" TEXT,
    "cnpj" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilLojaAcesso" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,

    CONSTRAINT "PerfilLojaAcesso_pkey" PRIMARY KEY ("id")
);

-- Backfill: create one default "Matriz" Loja per existing Cliente
INSERT INTO "Loja" ("id", "clienteId", "nome", "updatedAt")
SELECT 'loja_' || substr(md5(random()::text || clock_timestamp()::text || c."id"), 1, 20), c."id", 'Matriz', CURRENT_TIMESTAMP
FROM "Cliente" c;

-- Backfill: turn each distinct legacy Agent store label into a real Loja
INSERT INTO "Loja" ("id", "clienteId", "nome", "updatedAt")
SELECT 'loja_' || substr(md5(random()::text || clock_timestamp()::text || d."clienteId" || d."_legacyLojaLabel"), 1, 20), d."clienteId", d."_legacyLojaLabel", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "clienteId", "_legacyLojaLabel" FROM "Agent") d;

-- Backfill: point every existing row at its Cliente's default Loja
UPDATE "Alergico" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "CodigoBarrasFormato" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "ConfiguracaoAvancada" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "Device" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "DeviceGroup" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "Agent" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId" AND l."nome" = t."_legacyLojaLabel";
UPDATE "FormatoImpressao" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "Fornecedor" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "Imagem" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "Operador" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "Product" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "Setor" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "SpecParametro" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "SubSetor" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "TabelaNutricional" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "TeclaAcessoRapido" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";
UPDATE "TextoGlobal" t SET "lojaId" = l."id" FROM "Loja" l WHERE l."clienteId" = t."clienteId";

-- Enforce NOT NULL now that every row has a lojaId
ALTER TABLE "Alergico" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "CodigoBarrasFormato" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "ConfiguracaoAvancada" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Device" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "DeviceGroup" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Agent" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Agent" DROP COLUMN "_legacyLojaLabel";
ALTER TABLE "FormatoImpressao" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Fornecedor" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Imagem" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Operador" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "Setor" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "SpecParametro" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "SubSetor" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "TabelaNutricional" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "TeclaAcessoRapido" ALTER COLUMN "lojaId" SET NOT NULL;
ALTER TABLE "TextoGlobal" ALTER COLUMN "lojaId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_clienteId_nome_key" ON "Perfil"("clienteId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilLojaAcesso_perfilId_lojaId_key" ON "PerfilLojaAcesso"("perfilId", "lojaId");

-- CreateIndex
CREATE UNIQUE INDEX "Alergico_lojaId_numero_key" ON "Alergico"("lojaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "CodigoBarrasFormato_lojaId_numero_key" ON "CodigoBarrasFormato"("lojaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoAvancada_lojaId_key" ON "ConfiguracaoAvancada"("lojaId");

-- CreateIndex
CREATE UNIQUE INDEX "FormatoImpressao_lojaId_numero_key" ON "FormatoImpressao"("lojaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_lojaId_numero_key" ON "Fornecedor"("lojaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Operador_lojaId_numero_key" ON "Operador"("lojaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Product_lojaId_codigo_key" ON "Product"("lojaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Product_lojaId_codigoBarras_key" ON "Product"("lojaId", "codigoBarras");

-- CreateIndex
CREATE UNIQUE INDEX "Setor_lojaId_numero_key" ON "Setor"("lojaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "SpecParametro_lojaId_numero_key" ON "SpecParametro"("lojaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "SubSetor_lojaId_numero_key" ON "SubSetor"("lojaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "TabelaNutricional_lojaId_numero_key" ON "TabelaNutricional"("lojaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "TextoGlobal_lojaId_indice_key" ON "TextoGlobal"("lojaId", "indice");

-- AddForeignKey
ALTER TABLE "Loja" ADD CONSTRAINT "Loja_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilLojaAcesso" ADD CONSTRAINT "PerfilLojaAcesso_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilLojaAcesso" ADD CONSTRAINT "PerfilLojaAcesso_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceGroup" ADD CONSTRAINT "DeviceGroup_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setor" ADD CONSTRAINT "Setor_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSetor" ADD CONSTRAINT "SubSetor_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alergico" ADD CONSTRAINT "Alergico_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabelaNutricional" ADD CONSTRAINT "TabelaNutricional_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operador" ADD CONSTRAINT "Operador_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imagem" ADD CONSTRAINT "Imagem_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatoImpressao" ADD CONSTRAINT "FormatoImpressao_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoBarrasFormato" ADD CONSTRAINT "CodigoBarrasFormato_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextoGlobal" ADD CONSTRAINT "TextoGlobal_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeclaAcessoRapido" ADD CONSTRAINT "TeclaAcessoRapido_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecParametro" ADD CONSTRAINT "SpecParametro_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoAvancada" ADD CONSTRAINT "ConfiguracaoAvancada_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeLojaId_fkey" FOREIGN KEY ("activeLojaId") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
