-- CreateEnum
CREATE TYPE "UnidadeVenda" AS ENUM ('PESO', 'PECA');

-- CreateEnum
CREATE TYPE "NutrienteUnidade" AS ENUM ('KCAL_KJ', 'G', 'MG', 'MCG');

-- CreateEnum
CREATE TYPE "CodigoBarrasTipo" AS ENUM ('EAN13', 'EAN128');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "alergicoId" TEXT,
ADD COLUMN     "bandeiraCodigoBarras" INTEGER,
ADD COLUMN     "codigoBarrasFormatoId" TEXT,
ADD COLUMN     "desconto" DECIMAL(10,2),
ADD COLUMN     "diasDeVenda" INTEGER,
ADD COLUMN     "formatoImpressaoId" TEXT,
ADD COLUMN     "fornecedorId" TEXT,
ADD COLUMN     "imagemId" TEXT,
ADD COLUMN     "lote" TEXT,
ADD COLUMN     "modoEspecial" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pesoFixo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subSetorId" TEXT,
ADD COLUMN     "tabelaNutricionalId" TEXT,
ADD COLUMN     "tara" DECIMAL(10,3),
ADD COLUMN     "taraPorCento" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tempoDeVenda" INTEGER,
ADD COLUMN     "textoExtra1" TEXT,
ADD COLUMN     "textoExtra2" TEXT,
ADD COLUMN     "textoExtra3" TEXT,
ADD COLUMN     "textoExtra4" TEXT,
ADD COLUMN     "textoExtra5" TEXT,
ADD COLUMN     "textoExtra6" TEXT,
ADD COLUMN     "textoExtra7" TEXT,
ADD COLUMN     "unidadeVenda" "UnidadeVenda" NOT NULL DEFAULT 'PESO',
ADD COLUMN     "validadeDias" INTEGER,
ADD COLUMN     "validadePacote" INTEGER,
ADD COLUMN     "validadePacoteHoras" INTEGER;

-- CreateTable
CREATE TABLE "Setor" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubSetor" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "setorId" TEXT NOT NULL,
    "formatoImpressaoId" TEXT,
    "codigoBarrasFormatoId" TEXT,
    "bandeiraCodigoBarras" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubSetor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "informacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alergico" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "informacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alergico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabelaNutricional" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "porcao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TabelaNutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabelaNutricionalItem" (
    "id" TEXT NOT NULL,
    "tabelaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "ingrediente" TEXT NOT NULL,
    "unidade" "NutrienteUnidade" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "porcentagem" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "TabelaNutricionalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operador" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "codigo" TEXT,
    "permissoes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Imagem" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "larguraMm" DECIMAL(6,2),
    "alturaMm" DECIMAL(6,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Imagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormatoImpressao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" INTEGER NOT NULL DEFAULT 1,
    "larguraMm" INTEGER NOT NULL,
    "alturaMm" INTEGER NOT NULL,
    "layout" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormatoImpressao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodigoBarrasFormato" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "CodigoBarrasTipo" NOT NULL DEFAULT 'EAN13',
    "verificador" INTEGER NOT NULL DEFAULT 0,
    "constante1" INTEGER,
    "constante2" INTEGER,
    "detalhes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodigoBarrasFormato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextoGlobal" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "indice" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextoGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeclaAcessoRapido" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "pagina" TEXT NOT NULL,
    "layout" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeclaAcessoRapido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setor_clienteId_numero_key" ON "Setor"("clienteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "SubSetor_clienteId_numero_key" ON "SubSetor"("clienteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_clienteId_numero_key" ON "Fornecedor"("clienteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Alergico_clienteId_numero_key" ON "Alergico"("clienteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "TabelaNutricional_clienteId_numero_key" ON "TabelaNutricional"("clienteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Operador_clienteId_numero_key" ON "Operador"("clienteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "FormatoImpressao_clienteId_numero_key" ON "FormatoImpressao"("clienteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "CodigoBarrasFormato_clienteId_numero_key" ON "CodigoBarrasFormato"("clienteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "TextoGlobal_clienteId_indice_key" ON "TextoGlobal"("clienteId", "indice");

-- AddForeignKey
ALTER TABLE "Setor" ADD CONSTRAINT "Setor_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSetor" ADD CONSTRAINT "SubSetor_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSetor" ADD CONSTRAINT "SubSetor_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSetor" ADD CONSTRAINT "SubSetor_formatoImpressaoId_fkey" FOREIGN KEY ("formatoImpressaoId") REFERENCES "FormatoImpressao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSetor" ADD CONSTRAINT "SubSetor_codigoBarrasFormatoId_fkey" FOREIGN KEY ("codigoBarrasFormatoId") REFERENCES "CodigoBarrasFormato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alergico" ADD CONSTRAINT "Alergico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabelaNutricional" ADD CONSTRAINT "TabelaNutricional_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabelaNutricionalItem" ADD CONSTRAINT "TabelaNutricionalItem_tabelaId_fkey" FOREIGN KEY ("tabelaId") REFERENCES "TabelaNutricional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operador" ADD CONSTRAINT "Operador_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imagem" ADD CONSTRAINT "Imagem_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatoImpressao" ADD CONSTRAINT "FormatoImpressao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoBarrasFormato" ADD CONSTRAINT "CodigoBarrasFormato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextoGlobal" ADD CONSTRAINT "TextoGlobal_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeclaAcessoRapido" ADD CONSTRAINT "TeclaAcessoRapido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subSetorId_fkey" FOREIGN KEY ("subSetorId") REFERENCES "SubSetor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tabelaNutricionalId_fkey" FOREIGN KEY ("tabelaNutricionalId") REFERENCES "TabelaNutricional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_alergicoId_fkey" FOREIGN KEY ("alergicoId") REFERENCES "Alergico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_imagemId_fkey" FOREIGN KEY ("imagemId") REFERENCES "Imagem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_formatoImpressaoId_fkey" FOREIGN KEY ("formatoImpressaoId") REFERENCES "FormatoImpressao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_codigoBarrasFormatoId_fkey" FOREIGN KEY ("codigoBarrasFormatoId") REFERENCES "CodigoBarrasFormato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
