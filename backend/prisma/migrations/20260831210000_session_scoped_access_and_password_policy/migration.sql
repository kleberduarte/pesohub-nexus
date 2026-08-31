-- Card #48: sessão única por usuário e política de acesso no padrão bancário.
--
-- A empresa/loja ativa deixa de ser coluna do usuário e passa a ser estado de
-- sessão (carregado no JWT). Enquanto morava aqui, duas pessoas na mesma conta
-- se empurravam entre lojas e o efeito prático era sincronizar produto para a
-- balança da loja errada, sem aviso na tela.

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_activeClienteId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_activeLojaId_fkey";

-- DropIndex
DROP INDEX "User_activeClienteId_idx";

-- DropIndex
DROP INDEX "User_activeLojaId_idx";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "ip" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "activeClienteId",
DROP COLUMN "activeLojaId",
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "senhasAnteriores" TEXT[] DEFAULT ARRAY[]::TEXT[];
