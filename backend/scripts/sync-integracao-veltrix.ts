/**
 * Dispara a importação de produtos do Veltrix para a Loja configurada,
 * sem depender da UI (removida — configuração e disparo agora são via script,
 * config sempre lida direto da tabela IntegracaoVeltrix).
 *
 * Uso (a partir de backend/):
 *   CLIENTE_ID="..." npx ts-node scripts/sync-integracao-veltrix.ts
 *   npx ts-node scripts/sync-integracao-veltrix.ts        (sincroniza todos os ativos, p/ cron)
 */
import { PrismaClient } from "@prisma/client";
import { VeltrixClient, VeltrixProduct } from "../src/infrastructure/integrations/veltrix.client";

const prisma = new PrismaClient();
const CLIENTE_ID = process.env.CLIENTE_ID;

async function syncOne(config: {
  clienteId: string;
  lojaId: string;
  baseUrl: string;
  email: string;
  senha: string;
}) {
  const client = new VeltrixClient(config.baseUrl, config.email, config.senha);

  try {
    const produtos = await client.listProducts();
    const resultados = await Promise.all(produtos.map((p) => upsertProduct(config.clienteId, config.lojaId, p)));
    const importados = resultados.filter(Boolean).length;

    await prisma.integracaoVeltrix.update({
      where: { clienteId: config.clienteId },
      data: { ultimaSincronizacao: new Date(), ultimoStatus: "SUCCESS", ultimoErro: null },
    });

    console.log(
      `Cliente ${config.clienteId}: ${importados}/${produtos.length} produto(s) importado(s), ${produtos.length - importados} ignorado(s).`,
    );
  } catch (err) {
    const mensagem = (err as Error).message;
    console.error(`Cliente ${config.clienteId}: falha ao sincronizar — ${mensagem}`);
    await prisma.integracaoVeltrix.update({
      where: { clienteId: config.clienteId },
      data: { ultimaSincronizacao: new Date(), ultimoStatus: "ERROR", ultimoErro: mensagem },
    });
  }
}

async function upsertProduct(clienteId: string, lojaId: string, produto: VeltrixProduct): Promise<boolean> {
  const codigo = produto.codigoProduto?.trim();
  const codigoBarras = produto.gtinEan?.trim();
  const preco = produto.precoEfetivo ?? produto.price;

  if (!codigo || !codigoBarras || preco == null) {
    console.warn(`Produto Veltrix #${produto.id} ("${produto.name}") ignorado: faltam codigoProduto/gtinEan/preço.`);
    return false;
  }

  await prisma.product.upsert({
    where: { lojaId_codigo: { lojaId, codigo } },
    create: { clienteId, lojaId, codigo, codigoBarras, nome: produto.name, preco, ativo: produto.active ?? true },
    update: { codigoBarras, nome: produto.name, preco, ativo: produto.active ?? true },
  });
  return true;
}

async function main() {
  const configs = CLIENTE_ID
    ? await prisma.integracaoVeltrix.findMany({ where: { clienteId: CLIENTE_ID } })
    : await prisma.integracaoVeltrix.findMany({ where: { ativo: true } });

  if (configs.length === 0) {
    console.log("Nenhuma integração Veltrix ativa encontrada.");
    return;
  }

  for (const config of configs) {
    await syncOne(config);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
