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

-- AlterTable
ALTER TABLE "Alergico" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CodigoBarrasFormato" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ConfiguracaoAvancada" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DeviceGroup" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FormatoImpressao" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Fornecedor" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Imagem" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Operador" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Setor" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SpecParametro" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SubSetor" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TabelaNutricional" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeclaAcessoRapido" ADD COLUMN     "lojaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TextoGlobal" ADD COLUMN     "lojaId" TEXT NOT NULL;

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

