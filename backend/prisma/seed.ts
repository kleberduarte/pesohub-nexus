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

  const agentToken = process.env.SEED_AGENT_TOKEN ?? "dev-agent-local-token";
  const agent = await prisma.agent.upsert({
    where: { token: agentToken },
    update: {},
    create: { token: agentToken, lojaId: "loja-01", versao: "0.1.0" },
  });
  console.log(`Agent Local seed criado: token=${agentToken}`);

  const deviceIp = process.env.SEED_DEVICE_IP ?? "10.10.40.35";
  await prisma.device.upsert({
    where: { id: `seed-${deviceIp}` },
    update: { agentId: agent.id },
    create: {
      id: `seed-${deviceIp}`,
      nome: "Balança Loja 01",
      ip: deviceIp,
      porta: 33581,
      agentId: agent.id,
    },
  });
  console.log(`Dispositivo seed criado: ${deviceIp}:33581 vinculado ao Agent Local`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
