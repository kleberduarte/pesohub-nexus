-- Card #96: apagar um Perfil em uso deixava o usuário sem perfil (= todas as lojas).
ALTER TABLE "User" DROP CONSTRAINT "User_perfilId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
