/**
 * DESTRUTIVO: apaga TODOS os registros do banco, preservando apenas o
 * usuário informado em KEEP_USER_EMAIL (por padrão, o superadmin).
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." npx ts-node scripts/reset-production-data.ts
 *   (ou compile com `npx tsc` / rode via `npx ts-node` a partir de backend/)
 *
 * Exige a env CONFIRM=YES para rodar de fato; sem ela, apenas mostra
 * quantos registros existem em cada tabela (dry-run).
 */
import { PrismaClient } from "@prisma/client";

const KEEP_USER_EMAIL = process.env.KEEP_USER_EMAIL ?? "superadmin@pesohub.com.br";
const CONFIRMED = process.env.CONFIRM === "YES";

const prisma = new PrismaClient();

// Ordem irrelevante entre si: cada TRUNCATE usa CASCADE.
// IMPORTANTE: "User" tem FKs (opcionais, ON DELETE SET NULL) para Cliente,
// Loja e Perfil. TRUNCATE ... CASCADE no Postgres ignora a ação ON DELETE
// e trunca INCONDICIONALMENTE qualquer tabela que referencie a truncada —
// então essas três NÃO podem entrar nesta lista, ou "User" seria esvaziado
// junto (isso já aconteceu uma vez). Elas são apagadas via DELETE FROM,
// que respeita o valor real das FKs, na função main() abaixo.
const TABLES_TO_WIPE = [
  "AuditLog",
  "SyncJobItem",
  "SyncJob",
  "Product",
  "ConfiguracaoAvancada",
  "SpecParametro",
  "TeclaAcessoRapido",
  "TextoGlobal",
  "CodigoBarrasFormato",
  "FormatoImpressao",
  "Imagem",
  "Operador",
  "TabelaNutricionalItem",
  "TabelaNutricional",
  "Alergico",
  "Fornecedor",
  "SubSetor",
  "Setor",
  "Agent",
  "DeviceGroup",
  "Device",
  "Fatura",
  "Assinatura",
  "PerfilLojaAcesso",
];

// Referenciadas por "User" — apagar com DELETE (não TRUNCATE) e nesta ordem
// (Perfil/Loja antes de Cliente, pois ambas referenciam Cliente).
const TABLES_TO_DELETE_IN_ORDER = ["Perfil", "Loja", "Cliente"];

async function main() {
  const keepUser = await prisma.user.findUnique({ where: { email: KEEP_USER_EMAIL } });
  if (!keepUser) {
    throw new Error(`Usuário "${KEEP_USER_EMAIL}" não encontrado — abortando para não apagar tudo sem um usuário de acesso.`);
  }

  const counts: Record<string, number> = {};
  for (const table of [...TABLES_TO_WIPE, ...TABLES_TO_DELETE_IN_ORDER]) {
    const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::int as count FROM "${table}"`,
    );
    counts[table] = Number(count);
  }
  const otherUsers = await prisma.user.count({ where: { email: { not: KEEP_USER_EMAIL } } });

  console.log(`Usuário preservado: ${keepUser.email} (id: ${keepUser.id})`);
  console.log("Registros a apagar por tabela:");
  console.table({ ...counts, User: otherUsers });

  if (!CONFIRMED) {
    console.log("\nDry-run apenas. Rode novamente com CONFIRM=YES para apagar de verdade.");
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      // Solta as FKs opcionais do usuário preservado antes de arrancar o resto.
      await tx.user.update({
        where: { id: keepUser.id },
        data: { clienteId: null, activeClienteId: null, perfilId: null, activeLojaId: null },
      });

      await tx.user.deleteMany({ where: { id: { not: keepUser.id } } });

      for (const table of TABLES_TO_WIPE) {
        await tx.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
      }

      for (const table of TABLES_TO_DELETE_IN_ORDER) {
        await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
      }

      const remaining = await tx.user.findMany({ select: { id: true, email: true } });
      if (remaining.length !== 1 || remaining[0].id !== keepUser.id) {
        throw new Error(
          `Falha de segurança: esperava só "${keepUser.email}" na tabela User, encontrei ${JSON.stringify(remaining)}. Revertendo.`,
        );
      }
    },
    { timeout: 30_000 },
  );

  console.log(`\nConcluído. Apenas "${keepUser.email}" permanece no banco.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
