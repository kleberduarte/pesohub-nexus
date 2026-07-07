import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@ramuza.com.br";
  const senhaPlana = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const senha = await bcrypt.hash(senhaPlana, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, senha, role: "ADMIN" },
  });

  console.log(`Usuário seed criado: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
