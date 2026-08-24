/**
 * Configura (cria ou atualiza) a integração com o ERP Veltrix para um Cliente,
 * gravando direto na tabela IntegracaoVeltrix. Substitui a UI de configuração
 * que existia em /sync — a credencial fica só no banco, nunca em variável de
 * ambiente da aplicação, e o mesmo padrão de tabela por Cliente permite
 * plugar outros ERPs no futuro sem mexer em env vars.
 *
 * Uso (a partir de backend/):
 *   CLIENTE_EMAIL="dono@empresa.com.br" \
 *   LOJA_NOME="Loja Centro" \
 *   BASE_URL="https://veltrix.empresa.com.br" \
 *   EMAIL="integracao@empresa.com.br" \
 *   SENHA="..." \
 *   npx ts-node scripts/configure-integracao-veltrix.ts
 *
 * Opcionais: ATIVO=false | INTERVALO_MINUTOS=30
 * CLIENTE_EMAIL identifica o Cliente pelo e-mail de algum User vinculado a ele;
 * LOJA_NOME faz match por nome dentro do mesmo Cliente (use LOJA_ID se preferir exato).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLIENTE_EMAIL = process.env.CLIENTE_EMAIL;
const CLIENTE_ID = process.env.CLIENTE_ID;
const LOJA_NOME = process.env.LOJA_NOME;
const LOJA_ID = process.env.LOJA_ID;
const BASE_URL = process.env.BASE_URL;
const EMAIL = process.env.EMAIL;
const SENHA = process.env.SENHA;
const ATIVO = process.env.ATIVO ? process.env.ATIVO === "true" : undefined;
const INTERVALO_MINUTOS = process.env.INTERVALO_MINUTOS ? Number(process.env.INTERVALO_MINUTOS) : undefined;

async function resolveClienteId(): Promise<string> {
  if (CLIENTE_ID) return CLIENTE_ID;
  if (!CLIENTE_EMAIL) {
    throw new Error("Informe CLIENTE_ID ou CLIENTE_EMAIL.");
  }
  const user = await prisma.user.findUnique({ where: { email: CLIENTE_EMAIL } });
  if (!user?.clienteId) {
    throw new Error(`Nenhum usuário com clienteId encontrado para o e-mail "${CLIENTE_EMAIL}".`);
  }
  return user.clienteId;
}

async function resolveLojaId(clienteId: string): Promise<string> {
  if (LOJA_ID) return LOJA_ID;
  if (!LOJA_NOME) {
    throw new Error("Informe LOJA_ID ou LOJA_NOME.");
  }
  const loja = await prisma.loja.findFirst({ where: { clienteId, nome: LOJA_NOME } });
  if (!loja) {
    throw new Error(`Nenhuma loja "${LOJA_NOME}" encontrada para o Cliente ${clienteId}.`);
  }
  return loja.id;
}

async function main() {
  if (!BASE_URL || !EMAIL || !SENHA) {
    throw new Error("BASE_URL, EMAIL e SENHA são obrigatórios.");
  }

  const clienteId = await resolveClienteId();
  const lojaId = await resolveLojaId(clienteId);

  const config = await prisma.integracaoVeltrix.upsert({
    where: { clienteId },
    create: {
      clienteId,
      lojaId,
      baseUrl: BASE_URL.replace(/\/+$/, ""),
      email: EMAIL,
      senha: SENHA,
      ativo: ATIVO ?? true,
      intervaloMinutos: INTERVALO_MINUTOS ?? 15,
    },
    update: {
      lojaId,
      baseUrl: BASE_URL.replace(/\/+$/, ""),
      email: EMAIL,
      senha: SENHA,
      ...(ATIVO !== undefined ? { ativo: ATIVO } : {}),
      ...(INTERVALO_MINUTOS !== undefined ? { intervaloMinutos: INTERVALO_MINUTOS } : {}),
    },
  });

  const { senha: _senha, ...safe } = config;
  console.log("Integração Veltrix configurada:");
  console.table([safe]);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
