import { UnrecoverableError } from "bullmq";
import { prisma } from "./prisma";
import { AgentBridge, SyncCommandPayload } from "./agent-bridge";

/** Mesmo formato salvo pelo editor visual do frontend (`FormatoImpressaoPanel.tsx`):
 * `layout: { elementos: [{ id, tipo, x, y, largura, altura, texto? }, ...] }`. */
function getLayoutElementos(layout: unknown): {
  tipo?: string;
  texto?: string;
  imagemNumero?: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
  angulo?: number;
  alinhamento?: number;
  fonte?: number;
}[] {
  const elementos = (layout as { elementos?: unknown[] } | null)?.elementos;
  if (!Array.isArray(elementos)) return [];
  return elementos.map((el) => {
    const e = el as {
      tipo?: string;
      texto?: string;
      imagemNumero?: number;
      x?: number;
      y?: number;
      largura?: number;
      altura?: number;
      angulo?: number;
      alinhamento?: number;
      fonte?: number;
    };
    return {
      tipo: e.tipo,
      texto: e.texto,
      imagemNumero: e.imagemNumero,
      x: e.x ?? 0,
      y: e.y ?? 0,
      largura: e.largura ?? 0,
      altura: e.altura ?? 0,
      angulo: e.angulo,
      alinhamento: e.alinhamento,
      fonte: e.fonte,
    };
  });
}

export interface SyncJobData {
  deviceId: string;
  tipo: "TOTAL" | "INCREMENTAL";
  productIds?: string[];
  /**
   * Formatos de etiqueta a enviar mesmo sem produto que os use — preenchido
   * quando o disparo veio de "salvar layout".
   */
  formatoIds?: string[];
}

export function createSyncProcessor(agentBridge: AgentBridge) {
  return async function processSyncJob(job: { data: SyncJobData }) {
    const { deviceId, tipo, productIds, formatoIds } = job.data;

    const device = await prisma.device.findUniqueOrThrow({ where: { id: deviceId } });

    if (!device.agentId) {
      throw new Error(
        `Dispositivo "${device.nome}" (${device.ip}) não tem Agent Local vinculado — não é possível sincronizar.`,
      );
    }

    const productInclude = {
      tabelaNutricional: { include: { itens: { orderBy: { ordem: "asc" as const } } } },
      formatoImpressao: true,
      subSetor: { include: { setor: true } },
    };

    const products =
      tipo === "TOTAL"
        ? await prisma.product.findMany({
            where: { ativo: true, lojaId: device.lojaId },
            include: productInclude,
          })
        : await prisma.product.findMany({
            where: { id: { in: productIds ?? [] }, lojaId: device.lojaId },
            include: productInclude,
          });

    const formatosAvulsos =
      formatoIds != null && formatoIds.length > 0
        ? await prisma.formatoImpressao.findMany({
            where: { id: { in: formatoIds }, lojaId: device.lojaId },
          })
        : [];

    // Um pacote sem produto e sem formato não grava nada na balança, mas era
    // ACK'd e virava SUCCESS — o "sucesso que mente". Falha cedo, com o motivo.
    if (products.length === 0 && formatosAvulsos.length === 0) {
      const erro =
        tipo === "TOTAL"
          ? "Nenhum produto ativo nesta loja — não há o que sincronizar."
          : "A sincronização incremental não casou nenhum produto nem formato de etiqueta: nada seria enviado à balança.";
      // Registra o job mesmo assim: sem isso a falha só existiria no log do
      // worker, e a tela de Sincronização continuaria sem explicar o que houve.
      await prisma.syncJob.create({
        data: { deviceId, tipo, status: "ERROR", iniciadoEm: new Date(), concluidoEm: new Date(), erro },
      });
      // Não há retry que resolva um pacote vazio.
      throw new UnrecoverableError(erro);
    }

    const syncJob = await prisma.syncJob.create({
      data: {
        deviceId,
        tipo,
        status: "IN_PROGRESS",
        iniciadoEm: new Date(),
        items: {
          create: products.map((p) => ({
            productId: p.id,
            acao: "UPDATE",
            status: "PENDING",
          })),
        },
      },
    });

    const payload: SyncCommandPayload = {
      deviceId: device.id,
      deviceIp: device.ip,
      devicePort: device.porta,
      tipo,
      products: products.map((p) => ({
        codigo: p.codigo,
        codigoBarras: p.codigoBarras,
        nome: p.nome,
        preco: Number(p.preco),
        custo: p.custo != null ? Number(p.custo) : undefined,
        categoriaImposto: p.categoriaImposto ?? undefined,
        unidadeVenda: p.unidadeVenda,
        taxType: p.taxType ?? undefined,
        taxaImposto: p.taxaImposto != null ? Number(p.taxaImposto) : undefined,
        tara: p.tara != null ? Number(p.tara) : undefined,
        desconto: p.desconto != null ? Number(p.desconto) : undefined,
        textoExtra1: p.textoExtra1 ?? undefined,
        textoExtra2: p.textoExtra2 ?? undefined,
        textoExtra3: p.textoExtra3 ?? undefined,
        textoExtra4: p.textoExtra4 ?? undefined,
        textoExtra5: p.textoExtra5 ?? undefined,
        textoExtra6: p.textoExtra6 ?? undefined,
        textoExtra7: p.textoExtra7 ?? undefined,
        validadeDias: p.validadeDias ?? undefined,
        setor: p.subSetor?.setor ? { numero: p.subSetor.setor.numero, nome: p.subSetor.setor.nome } : undefined,
        formatoImpressao: p.formatoImpressao
          ? {
              numero: p.formatoImpressao.numero,
              nome: p.formatoImpressao.nome,
              larguraMm: p.formatoImpressao.larguraMm,
              alturaMm: p.formatoImpressao.alturaMm,
              elementos: getLayoutElementos(p.formatoImpressao.layout).map((el) => ({
                tipo: el.tipo,
                texto: el.texto,
                imagemNumero: el.imagemNumero,
                x: el.x,
                y: el.y,
                largura: el.largura,
                altura: el.altura,
                angulo: el.angulo,
                alinhamento: el.alinhamento,
                fonte: el.fonte,
              })),
            }
          : undefined,
        tabelaNutricional: p.tabelaNutricional
          ? {
              numero: p.tabelaNutricional.numero,
              nome: p.tabelaNutricional.nome,
              porcao: p.tabelaNutricional.porcao ?? undefined,
              porcoesPorEmbalagem: p.tabelaNutricional.porcoesPorEmbalagem ?? undefined,
              ingredientes: p.tabelaNutricional.ingredientes ?? undefined,
              selos: p.tabelaNutricional.selos,
              itens: p.tabelaNutricional.itens.map((it) => ({
                ordem: it.ordem,
                valor: Number(it.valor),
                porcentagem: Number(it.porcentagem),
                ingrediente: it.ingrediente,
              })),
            }
          : undefined,
      })),
      formatosImpressao: formatosAvulsos.map((f) => ({
        numero: f.numero,
        nome: f.nome,
        larguraMm: f.larguraMm,
        alturaMm: f.alturaMm,
        elementos: getLayoutElementos(f.layout).map((el) => ({
          tipo: el.tipo,
          texto: el.texto,
          imagemNumero: el.imagemNumero,
          x: el.x,
          y: el.y,
          largura: el.largura,
          altura: el.altura,
          angulo: el.angulo,
          alinhamento: el.alinhamento,
          fonte: el.fonte,
        })),
      })),
    };

    try {
      const result = await agentBridge.sendToAgent(device.agentId, payload);

      if (!result.ok) {
        throw new Error(result.erro ?? "Agent Local reportou falha sem detalhe.");
      }

      await prisma.$transaction([
        prisma.syncJob.update({
          where: { id: syncJob.id },
          data: { status: "SUCCESS", concluidoEm: new Date() },
        }),
        prisma.syncJobItem.updateMany({
          where: { jobId: syncJob.id },
          data: { status: "SUCCESS" },
        }),
        prisma.device.update({
          where: { id: deviceId },
          data: { status: "ONLINE", ultimoAcesso: new Date() },
        }),
      ]);

      return { syncJobId: syncJob.id, itensProcessados: products.length };
    } catch (err) {
      const erro = err instanceof Error ? err.message : String(err);

      await prisma.$transaction([
        prisma.syncJob.update({
          where: { id: syncJob.id },
          data: { status: "ERROR", concluidoEm: new Date(), erro },
        }),
        prisma.syncJobItem.updateMany({
          where: { jobId: syncJob.id },
          data: { status: "ERROR" },
        }),
        prisma.device.update({
          where: { id: deviceId },
          data: { status: "OFFLINE" },
        }),
      ]);

      // Rethrow: Bull faz retry automático (3 tentativas, backoff exponencial — ver sync-queue.module.ts)
      throw err;
    }
  };
}
