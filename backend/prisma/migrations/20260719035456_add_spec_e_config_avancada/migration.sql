-- CreateTable
CREATE TABLE "SpecParametro" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecParametro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoAvancada" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "menusHabilitados" JSONB,
    "funcaoPluPermitir" JSONB,
    "fonteExibicao" TEXT,
    "formatoDataHora" TEXT,
    "excluirRegistrosDias" INTEGER,
    "importacaoPluCampos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoAvancada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpecParametro_clienteId_numero_key" ON "SpecParametro"("clienteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoAvancada_clienteId_key" ON "ConfiguracaoAvancada"("clienteId");

-- AddForeignKey
ALTER TABLE "SpecParametro" ADD CONSTRAINT "SpecParametro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoAvancada" ADD CONSTRAINT "ConfiguracaoAvancada_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
