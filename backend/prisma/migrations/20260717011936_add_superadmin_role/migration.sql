-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN';

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_clienteId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "clienteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
