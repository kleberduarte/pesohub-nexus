-- CreateTable
CREATE TABLE "IntegracaoVeltrix" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "intervaloMinutos" INTEGER NOT NULL DEFAULT 15,
    "ultimaSincronizacao" TIMESTAMP(3),
    "ultimoStatus" TEXT,
    "ultimoErro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracaoVeltrix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegracaoVeltrix_clienteId_key" ON "IntegracaoVeltrix"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegracaoVeltrix_lojaId_key" ON "IntegracaoVeltrix"("lojaId");

-- AddForeignKey
ALTER TABLE "IntegracaoVeltrix" ADD CONSTRAINT "IntegracaoVeltrix_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegracaoVeltrix" ADD CONSTRAINT "IntegracaoVeltrix_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
