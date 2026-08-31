import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const padrao = await prisma.cliente.upsert({
    where: { id: "cliente-default" },
    update: { isDefault: true, dominio: "pesohub.com.br" },
    create: {
      id: "cliente-default",
      nome: "PesoHub",
      tagline: "Conectando dados, pesando o futuro",
      corPrimaria: "#004080",
      corSecundaria: "#001d3d",
      corBotao: "#004080",
      corBotaoTexto: "#ffffff",
      isDefault: true,
      dominio: "pesohub.com.br",
    },
  });
  console.log(`Cliente seed criado: ${padrao.nome} (default)`);

  const ramuza = await prisma.cliente.upsert({
    where: { id: "cliente-ramuza" },
    update: { isDefault: false, dominio: "ramuza.com.br" },
    create: {
      id: "cliente-ramuza",
      nome: "Ramuza",
      corPrimaria: "#E30613",
      corSecundaria: "#333333",
      dominio: "ramuza.com.br",
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

  // A Ramuza é revendedora: instala balanças em nome de clientes finais
  // (Carrefour, Pão de Açúcar, Açaí do Bairro) sem que cada um precise de
  // identidade visual própria — tudo aparece sob a marca da Ramuza.
  const lojasSeed = [
    { id: "loja-default", clienteId: padrao.id, nome: "Loja padrão" },
    { id: "loja-ramuza-carrefour", clienteId: ramuza.id, nome: "Carrefour" },
    { id: "loja-ramuza-paodeacucar", clienteId: ramuza.id, nome: "Pão de Açúcar" },
    { id: "loja-ramuza-acai", clienteId: ramuza.id, nome: "Açaí do Bairro" },
    { id: "loja-acme-matriz", clienteId: acme.id, nome: "Matriz" },
  ];
  const lojas: Record<string, Awaited<ReturnType<typeof prisma.loja.upsert>>> = {};
  for (const l of lojasSeed) {
    lojas[l.id] = await prisma.loja.upsert({
      where: { id: l.id },
      update: {},
      create: l,
    });
    console.log(`Loja seed criada: ${l.nome} (${l.clienteId})`);
  }

  const perfilRegional = await prisma.perfil.upsert({
    where: { clienteId_nome: { clienteId: ramuza.id, nome: "Gerente Regional" } },
    update: {},
    create: {
      clienteId: ramuza.id,
      nome: "Gerente Regional",
      lojas: {
        create: [{ lojaId: lojas["loja-ramuza-carrefour"].id }, { lojaId: lojas["loja-ramuza-paodeacucar"].id }],
      },
    },
  });
  console.log(`Perfil seed criado: ${perfilRegional.nome} (acesso a Carrefour + Pão de Açúcar)`);

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@pesohub.com.br";
  const senhaPlana = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const senha = await bcrypt.hash(senhaPlana, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      senha,
      role: "ADMIN",
      clienteId: ramuza.id,
      // A loja ativa é estado de sessão desde o card #48 — a sessão começa na
      // primeira loja do Cliente e trocar de loja vale só para quem trocou.
    },
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
  const lojaAgent = lojas["loja-ramuza-carrefour"];
  const agent = await prisma.agent.upsert({
    where: { token: agentToken },
    update: {},
    create: { token: agentToken, lojaId: lojaAgent.id, versao: "0.1.0", clienteId: ramuza.id },
  });
  console.log(`Agent Local seed criado: token=${agentToken} (loja=${lojaAgent.nome})`);

  const deviceIp = process.env.SEED_DEVICE_IP ?? "10.10.40.35";
  await prisma.device.upsert({
    where: { id: `seed-${deviceIp}` },
    update: { agentId: agent.id },
    create: {
      id: `seed-${deviceIp}`,
      clienteId: ramuza.id,
      lojaId: lojaAgent.id,
      nome: "Balança Carrefour 01",
      ip: deviceIp,
      porta: 33581,
      agentId: agent.id,
    },
  });
  console.log(`Dispositivo seed criado: ${deviceIp}:33581 vinculado ao Agent Local (${lojaAgent.nome})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
