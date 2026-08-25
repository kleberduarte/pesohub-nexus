/**
 * SUPERADMIN passou a existir só na empresa padrão (PesoHub) — qualquer
 * usuário SUPERADMIN "travado" numa empresa cliente (clienteId preenchido)
 * é uma sobra do desenho antigo (domain-scoped SUPERADMIN por empresa) e
 * deve virar ADMIN, que já tem as mesmas permissões dentro da própria
 * empresa (a única coisa que perde é gerenciar outros SUPERADMIN).
 *
 * Uso (a partir de backend/):
 *   npx ts-node scripts/demote-scoped-superadmins.ts            (dry-run, só lista)
 *   CONFIRM=YES npx ts-node scripts/demote-scoped-superadmins.ts  (aplica de verdade)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CONFIRMED = process.env.CONFIRM === "YES";

async function main() {
  const scoped = await prisma.user.findMany({
    where: { role: "SUPERADMIN", clienteId: { not: null } },
    select: { id: true, email: true, clienteId: true },
  });

  if (scoped.length === 0) {
    console.log("Nenhum SUPERADMIN travado numa empresa cliente encontrado.");
    return;
  }

  console.log(`${scoped.length} usuário(s) SUPERADMIN travado(s) numa empresa cliente:`);
  console.table(scoped);

  if (!CONFIRMED) {
    console.log("\nDry-run apenas. Rode novamente com CONFIRM=YES para rebaixar pra ADMIN de verdade.");
    return;
  }

  const result = await prisma.user.updateMany({
    where: { role: "SUPERADMIN", clienteId: { not: null } },
    data: { role: "ADMIN" },
  });
  console.log(`\n${result.count} usuário(s) rebaixado(s) para ADMIN.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
