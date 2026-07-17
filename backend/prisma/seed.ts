import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const padrao = await prisma.cliente.upsert({
    where: { id: "cliente-default" },
    update: { isDefault: true },
    create: {
      id: "cliente-default",
      nome: "PesoHub",
      tagline: "Conectando dados, pesando o futuro",
      corPrimaria: "#004080",
      corSecundaria: "#001d3d",
      corBotao: "#004080",
      corBotaoTexto: "#ffffff",
      isDefault: true,
    },
  });
  console.log(`Cliente seed criado: ${padrao.nome} (default)`);

  const ramuza = await prisma.cliente.upsert({
    where: { id: "cliente-ramuza" },
    update: { isDefault: false },
    create: {
      id: "cliente-ramuza",
      nome: "Ramuza",
      corPrimaria: "#E30613",
      corSecundaria: "#333333",
    },
  });
  console.log(`Cliente seed criado: ${ramuza.nome}`);

  const acme = await prisma.cliente.upsert({
    where: { id: "cliente-acme" },
    update: {},
    create: {
      id: "cliente-acme",
      nome: "Acme Distribuidora",
      corPrimaria: "#0EA5E9",
      corSecundaria: "#1E293B",
    },
  });
  console.log(`Cliente seed criado: ${acme.nome}`);

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@pesohub.com.br";
  const senhaPlana = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const senha = await bcrypt.hash(senhaPlana, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, senha, role: "ADMIN", clienteId: ramuza.id },
  });

  console.log(`Usuário seed criado: ${email}`);

  const superadminEmail = process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@pesohub.com.br";
  const superadminSenhaPlana = process.env.SEED_SUPERADMIN_PASSWORD ?? "superadmin123";
  const superadminSenha = await bcrypt.hash(superadminSenhaPlana, 10);

  await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {},
    create: { email: superadminEmail, senha: superadminSenha, role: "SUPERADMIN", clienteId: null },
  });

  console.log(`Usuário seed criado: ${superadminEmail}`);

  const agentToken = process.env.SEED_AGENT_TOKEN ?? "dev-agent-local-token";
  const agent = await prisma.agent.upsert({
    where: { token: agentToken },
    update: {},
    create: { token: agentToken, lojaId: "loja-01", versao: "0.1.0", clienteId: ramuza.id },
  });
  console.log(`Agent Local seed criado: token=${agentToken}`);

  const deviceIp = process.env.SEED_DEVICE_IP ?? "10.10.40.35";
  await prisma.device.upsert({
    where: { id: `seed-${deviceIp}` },
    update: { agentId: agent.id },
    create: {
      id: `seed-${deviceIp}`,
      clienteId: ramuza.id,
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
