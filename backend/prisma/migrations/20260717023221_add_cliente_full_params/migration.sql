-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "chavePix" TEXT,
ADD COLUMN     "corBotao" TEXT,
ADD COLUMN     "corBotaoTexto" TEXT,
ADD COLUMN     "corFundo" TEXT,
ADD COLUMN     "corTexto" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suporteEmail" TEXT,
ADD COLUMN     "suporteWhatsapp" TEXT;
