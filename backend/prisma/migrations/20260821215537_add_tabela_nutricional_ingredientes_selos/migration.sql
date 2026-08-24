-- AlterTable
ALTER TABLE "TabelaNutricional" ADD COLUMN     "porcoesPorEmbalagem" INTEGER,
ADD COLUMN     "ingredientes" TEXT,
ADD COLUMN     "selos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
