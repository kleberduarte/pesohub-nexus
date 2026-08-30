/**
 * Rotaciona o `Cliente.accessToken` de todas as empresas para um valor gerado
 * por CSPRNG.
 *
 * Por que: o schema define `accessToken String @unique @default(cuid())`, e cuid
 * é derivado de timestamp + contador + fingerprint da máquina — não é um segredo.
 * Quem conhecesse um token conseguiria enumerar os vizinhos e ler o branding de
 * outras empresas pelo endpoint público GET /api/v1/clientes/acesso/:token.
 * Novas empresas já nascem com token aleatório (ver clientes.controller.ts);
 * este script cuida das que foram criadas antes disso.
 *
 * ATENÇÃO: invalida os links de acesso já distribuídos — cada empresa precisa
 * receber o link novo. Rode com DATABASE_URL apontando para o ambiente certo:
 *   npx ts-node scripts/rotate-cliente-access-tokens.ts
 */
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clientes = await prisma.cliente.findMany({ select: { id: true, nome: true, accessToken: true } });
  for (const cliente of clientes) {
    const accessToken = randomBytes(32).toString("base64url");
    await prisma.cliente.update({ where: { id: cliente.id }, data: { accessToken } });
    console.log(`${cliente.nome}: novo link /acesso/${accessToken}`);
  }
  console.log(`\n${clientes.length} empresa(s) rotacionada(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
