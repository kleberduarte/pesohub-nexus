-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeClienteId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeClienteId_fkey" FOREIGN KEY ("activeClienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
