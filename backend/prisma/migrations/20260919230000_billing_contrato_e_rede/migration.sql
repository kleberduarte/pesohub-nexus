-- Card #97: separa o contrato B2B da fabricante da assinatura SaaS do cliente final.

CREATE TYPE "StatusCompetencia" AS ENUM ('APURADA', 'COBRADA', 'PAGA', 'VENCIDA', 'CANCELADA');

-- Assinatura passa a ser por REDE de lojas (dominioRede). As linhas existentes
-- ficam com dominioRede NULL = assinatura antiga no nível da empresa.
ALTER TABLE "Assinatura" ADD COLUMN "dominioRede" TEXT;
ALTER TABLE "Assinatura" ADD COLUMN "valorUnitario" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Assinatura" ADD COLUMN "quantidadeMinima" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Assinatura" ADD COLUMN "quantidadeBalancas" INTEGER NOT NULL DEFAULT 0;
DROP INDEX IF EXISTS "Assinatura_clienteId_key";
CREATE UNIQUE INDEX "Assinatura_clienteId_dominioRede_key" ON "Assinatura"("clienteId", "dominioRede");

CREATE TABLE "ContratoLicenciamento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "quantidadeMinima" INTEGER NOT NULL,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "asaasCustomerId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContratoLicenciamento_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContratoLicenciamento_clienteId_key" ON "ContratoLicenciamento"("clienteId");
ALTER TABLE "ContratoLicenciamento" ADD CONSTRAINT "ContratoLicenciamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CompetenciaFaturada" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "quantidadeApurada" INTEGER NOT NULL,
    "quantidadeFaturada" INTEGER NOT NULL,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "status" "StatusCompetencia" NOT NULL DEFAULT 'APURADA',
    "asaasPaymentId" TEXT,
    "linkPagamento" TEXT,
    "fechadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompetenciaFaturada_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CompetenciaFaturada_asaasPaymentId_key" ON "CompetenciaFaturada"("asaasPaymentId");
CREATE UNIQUE INDEX "CompetenciaFaturada_contratoId_competencia_key" ON "CompetenciaFaturada"("contratoId", "competencia");
CREATE INDEX "CompetenciaFaturada_status_idx" ON "CompetenciaFaturada"("status");
ALTER TABLE "CompetenciaFaturada" ADD CONSTRAINT "CompetenciaFaturada_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "ContratoLicenciamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "EventoAsaas" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "asaasPaymentId" TEXT,
    "payload" JSONB NOT NULL,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadoEm" TIMESTAMP(3),
    "resultado" TEXT,
    CONSTRAINT "EventoAsaas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventoAsaas_eventoId_key" ON "EventoAsaas"("eventoId");
CREATE INDEX "EventoAsaas_asaasPaymentId_idx" ON "EventoAsaas"("asaasPaymentId");
