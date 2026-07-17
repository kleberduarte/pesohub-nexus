-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "logoUrl" TEXT,
    "corPrimaria" TEXT,
    "corSecundaria" TEXT,
    "tagline" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- Seed the Ramuza tenant so existing rows have a home
INSERT INTO "Cliente" ("id", "nome", "corPrimaria", "corSecundaria")
VALUES ('cliente-ramuza', 'Ramuza', '#E30613', '#333333');

-- AlterTable (nullable first, backfill, then enforce NOT NULL)
ALTER TABLE "Agent" ADD COLUMN "clienteId" TEXT;
UPDATE "Agent" SET "clienteId" = 'cliente-ramuza';
ALTER TABLE "Agent" ALTER COLUMN "clienteId" SET NOT NULL;

ALTER TABLE "Device" ADD COLUMN "clienteId" TEXT;
UPDATE "Device" SET "clienteId" = 'cliente-ramuza';
ALTER TABLE "Device" ALTER COLUMN "clienteId" SET NOT NULL;

ALTER TABLE "DeviceGroup" ADD COLUMN "clienteId" TEXT;
UPDATE "DeviceGroup" SET "clienteId" = 'cliente-ramuza';
ALTER TABLE "DeviceGroup" ALTER COLUMN "clienteId" SET NOT NULL;

ALTER TABLE "Product" ADD COLUMN "clienteId" TEXT;
UPDATE "Product" SET "clienteId" = 'cliente-ramuza';
ALTER TABLE "Product" ALTER COLUMN "clienteId" SET NOT NULL;

ALTER TABLE "User" ADD COLUMN "clienteId" TEXT;
UPDATE "User" SET "clienteId" = 'cliente-ramuza';
ALTER TABLE "User" ALTER COLUMN "clienteId" SET NOT NULL;

-- DropIndex (global unique -> replaced by composite tenant-scoped unique)
DROP INDEX "Product_codigoBarras_key";
DROP INDEX "Product_codigo_key";

-- CreateIndex
CREATE UNIQUE INDEX "Product_clienteId_codigo_key" ON "Product"("clienteId", "codigo");
CREATE UNIQUE INDEX "Product_clienteId_codigoBarras_key" ON "Product"("clienteId", "codigoBarras");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeviceGroup" ADD CONSTRAINT "DeviceGroup_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
