import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { calcularCobranca, competenciaDe, limiteDeCarencia } from "../../../domain/services/precificacao";

/**
 * Painel financeiro do PesoHub (card #98).
 *
 * Visão consolidada de TODA a base: as assinaturas das redes de supermercado e
 * os contratos de licenciamento das fabricantes. Só existe para o SUPERADMIN
 * global — quem opera o produto — e nunca para uma empresa cliente, que não
 * pode ver a cobrança de outra.
 *
 * É leitura pura: nenhuma chamada ao Asaas, nenhum valor recalculado no banco.
 * A "prévia" mostra quanto a assinatura ficaria com as balanças de hoje, o que
 * deixa visível uma cobrança defasada sem alterar nada.
 */

export type SituacaoCobranca = "ATIVA" | "AGUARDANDO" | "ATRASADA" | "BLOQUEADA" | "CANCELADA";

export interface LinhaAssinatura {
  id: string;
  empresa: string;
  clienteId: string;
  rede: string | null;
  situacao: SituacaoCobranca;
  status: string;
  formaPagamento: string;
  valorUnitario: number;
  quantidadeMinima: number;
  balancasCobradas: number;
  balancasHoje: number;
  valor: number;
  valorPrevisto: number;
  proximoVencimento: Date | null;
  ultimaFatura: {
    valor: number;
    status: string;
    vencimento: Date | null;
    pagamento: Date | null;
    link: string | null;
  } | null;
}

export interface LinhaCompetencia {
  id: string;
  competencia: string;
  quantidadeApurada: number;
  quantidadeFaturada: number;
  valorTotal: number;
  status: string;
  dataVencimento: Date;
  dataPagamento: Date | null;
  link: string | null;
}

export interface LinhaContrato {
  id: string;
  empresa: string;
  clienteId: string;
  ativo: boolean;
  valorUnitario: number;
  quantidadeMinima: number;
  diaVencimento: number;
  temClienteNoAsaas: boolean;
  previa: { competencia: string; quantidadeApurada: number; quantidadeFaturada: number; valorUnitario: number; valorTotal: number };
  competencias: LinhaCompetencia[];
}

export function situacaoDaAssinatura(
  status: string,
  proximoVencimento: Date | null,
  agora = new Date(),
): SituacaoCobranca {
  if (status === "CANCELADA") return "CANCELADA";
  if (status === "TRIAL") return "AGUARDANDO";
  if (status !== "INADIMPLENTE") return "ATIVA";
  const limite = proximoVencimento
    ? limiteDeCarencia(proximoVencimento)
    : null;
  // Em atraso mas dentro da carência a rede segue trabalhando; passou, trava.
  return limite && agora > limite ? "BLOQUEADA" : "ATRASADA";
}

@Injectable()
export class PainelService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Só o SUPERADMIN "global" (sem empresa fixa no cadastro) enxerga o painel,
   * e apenas enquanto estiver na EMPRESA PADRÃO. Trocar para uma empresa
   * cliente é entrar no contexto dela — e ali o financeiro do PesoHub não tem
   * lugar, nem para quem poderia vê-lo.
   */
  async exigirSuperadminGlobal(userId: string, clienteAtivoId?: string | null): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, clienteId: true },
    });
    if (user?.role !== "SUPERADMIN" || user.clienteId !== null) {
      throw new ForbiddenException("Painel financeiro é exclusivo do administrador do PesoHub.");
    }
    if (clienteAtivoId !== undefined) {
      const ativo = clienteAtivoId
        ? await this.prisma.cliente.findUnique({ where: { id: clienteAtivoId }, select: { isDefault: true } })
        : null;
      if (!ativo?.isDefault) {
        throw new ForbiddenException("Volte para a empresa padrão para acessar o painel financeiro.");
      }
    }
  }

  async visaoGeral(agora = new Date()) {
    const [assinaturas, contratos] = await Promise.all([
      this.prisma.assinatura.findMany({
        include: {
          cliente: { select: { id: true, nome: true } },
          faturas: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: [{ clienteId: "asc" }, { dominioRede: "asc" }],
      }),
      this.prisma.contratoLicenciamento.findMany({
        include: {
          cliente: { select: { id: true, nome: true } },
          competencias: { orderBy: { competencia: "desc" }, take: 12 },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Balanças em DUAS consultas agrupadas, não uma por linha: com centenas de
    // empresas, um count por assinatura viraria centenas de idas ao banco em
    // sequência, segurando a conexão por segundos a cada abertura da tela.
    const [porLoja, porEmpresa, lojas] = await Promise.all([
      this.prisma.device.groupBy({ by: ["lojaId"], _count: { _all: true } }),
      this.prisma.device.groupBy({ by: ["clienteId"], _count: { _all: true } }),
      this.prisma.loja.findMany({ select: { id: true, clienteId: true, dominioEmail: true } }),
    ]);
    const balancasDaLoja = new Map(porLoja.map((g) => [g.lojaId, g._count._all]));
    const balancasDaEmpresa = new Map(porEmpresa.map((g) => [g.clienteId, g._count._all]));

    const balancasPorRede = new Map<string, number>();
    for (const loja of lojas) {
      if (!loja.dominioEmail) continue;
      const chave = `${loja.clienteId}:${loja.dominioEmail.toLowerCase()}`;
      balancasPorRede.set(chave, (balancasPorRede.get(chave) ?? 0) + (balancasDaLoja.get(loja.id) ?? 0));
    }
    // Assinatura antiga (sem rede) enxerga o parque inteiro da empresa.
    for (const a of assinaturas) {
      if (a.dominioRede) continue;
      balancasPorRede.set(`${a.clienteId}:`, balancasDaEmpresa.get(a.clienteId) ?? 0);
    }

    const linhasAssinaturas: LinhaAssinatura[] = assinaturas.map((a) => {
      const balancasHoje = balancasPorRede.get(`${a.clienteId}:${(a.dominioRede ?? "").toLowerCase()}`) ?? 0;
      const previa = calcularCobranca(balancasHoje, Number(a.valorUnitario) || 0, a.quantidadeMinima);
      const ultima = a.faturas[0];
      return {
        id: a.id,
        empresa: a.cliente.nome,
        clienteId: a.clienteId,
        rede: a.dominioRede,
        situacao: situacaoDaAssinatura(a.status, a.proximoVencimento, agora),
        status: a.status,
        formaPagamento: a.formaPagamento,
        valorUnitario: Number(a.valorUnitario),
        quantidadeMinima: a.quantidadeMinima,
        balancasCobradas: a.quantidadeBalancas,
        balancasHoje,
        valor: Number(a.valor),
        valorPrevisto: previa.valorTotal,
        proximoVencimento: a.proximoVencimento,
        ultimaFatura: ultima
          ? {
              valor: Number(ultima.valor),
              status: ultima.status,
              vencimento: ultima.dataVencimento,
              pagamento: ultima.dataPagamento,
              link: ultima.linkPagamento,
            }
          : null,
      };
    });

    const competenciaAtual = competenciaDe(agora);
    const linhasContratos: LinhaContrato[] = await Promise.all(
      contratos.map(async (c) => {
        const previa = calcularCobranca(
          balancasDaEmpresa.get(c.clienteId) ?? 0,
          Number(c.valorUnitario),
          c.quantidadeMinima,
        );
        return {
          id: c.id,
          empresa: c.cliente.nome,
          clienteId: c.clienteId,
          ativo: c.ativo,
          valorUnitario: Number(c.valorUnitario),
          quantidadeMinima: c.quantidadeMinima,
          diaVencimento: c.diaVencimento,
          temClienteNoAsaas: !!c.asaasCustomerId,
          previa: { competencia: competenciaAtual, ...previa },
          competencias: c.competencias.map((f) => ({
            id: f.id,
            competencia: f.competencia,
            quantidadeApurada: f.quantidadeApurada,
            quantidadeFaturada: f.quantidadeFaturada,
            valorTotal: Number(f.valorTotal),
            status: f.status,
            dataVencimento: f.dataVencimento,
            dataPagamento: f.dataPagamento,
            link: f.linkPagamento,
          })),
        };
      }),
    );

    return {
      resumo: this.resumir(linhasAssinaturas, linhasContratos, agora),
      assinaturas: linhasAssinaturas,
      contratos: linhasContratos,
    };
  }

  /**
   * Números do topo. "Previsto" é o que entra por mês se todos pagarem;
   * "em atraso" soma o que já venceu e não foi pago — os dois separados, para
   * ninguém confundir receita contratada com dinheiro em caixa.
   */
  private resumir(assinaturas: LinhaAssinatura[], contratos: LinhaContrato[], agora: Date) {
    const ativas = assinaturas.filter((a) => a.situacao !== "CANCELADA");
    const mensalidadeRedes = ativas.reduce((s, a) => s + a.valor, 0);
    const mensalidadeContratos = contratos.filter((c) => c.ativo).reduce((s, c) => s + c.previa.valorTotal, 0);

    const emAtraso =
      ativas.filter((a) => a.situacao === "ATRASADA" || a.situacao === "BLOQUEADA").reduce((s, a) => s + a.valor, 0) +
      contratos.flatMap((c) => c.competencias).filter((f) => f.status === "VENCIDA").reduce((s, f) => s + f.valorTotal, 0);

    const mesAtual = competenciaDe(agora);
    const recebidoNoMes = contratos
      .flatMap((c) => c.competencias)
      .filter((f) => f.status === "PAGA" && f.dataPagamento && competenciaDe(new Date(f.dataPagamento)) === mesAtual)
      .reduce((s, f) => s + f.valorTotal, 0);

    return {
      receitaMensalPrevista: Number((mensalidadeRedes + mensalidadeContratos).toFixed(2)),
      mensalidadeRedes: Number(mensalidadeRedes.toFixed(2)),
      mensalidadeContratos: Number(mensalidadeContratos.toFixed(2)),
      emAtraso: Number(emAtraso.toFixed(2)),
      recebidoNoMes: Number(recebidoNoMes.toFixed(2)),
      assinaturasAtivas: ativas.filter((a) => a.situacao === "ATIVA").length,
      assinaturasAguardando: ativas.filter((a) => a.situacao === "AGUARDANDO").length,
      assinaturasEmAtraso: ativas.filter((a) => a.situacao === "ATRASADA" || a.situacao === "BLOQUEADA").length,
      contratosAtivos: contratos.filter((c) => c.ativo).length,
    };
  }
}
