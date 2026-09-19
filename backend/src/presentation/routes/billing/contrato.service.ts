import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { AsaasService } from "../../../infrastructure/billing/asaas.service";
import { UpsertContratoDto } from "../../../application/dtos/upsert-contrato.dto";
import {
  calcularCobranca,
  competenciaDe,
  fimDaCompetencia,
  vencimentoDaCompetencia,
} from "../../../domain/services/precificacao";

/**
 * Contrato B2B da fabricante (card #97): licenciamento por balança, com mínimo
 * mensal garantido, apurado mês a mês.
 *
 * Não é assinatura SaaS: a quantidade muda todo mês conforme a fabricante
 * vende balanças, então cada competência vira uma cobrança avulsa no Asaas.
 *
 * Atraso aqui NÃO bloqueia o sistema — bloquear a empresa derrubaria junto
 * todos os supermercados que dependem dela. É cobrança comercial.
 */
@Injectable()
export class ContratoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaas: AsaasService,
  ) {}

  async upsert(clienteId: string, dto: UpsertContratoDto) {
    const dados = {
      valorUnitario: dto.valorUnitario,
      quantidadeMinima: dto.quantidadeMinima,
      diaVencimento: dto.diaVencimento ?? 10,
      ativo: dto.ativo ?? true,
    };
    return this.prisma.contratoLicenciamento.upsert({
      where: { clienteId },
      create: { clienteId, ...dados },
      update: dados,
    });
  }

  async detalhe(clienteId: string) {
    const contrato = await this.prisma.contratoLicenciamento.findUnique({
      where: { clienteId },
      include: { competencias: { orderBy: { competencia: "desc" }, take: 24 } },
    });
    if (!contrato) throw new NotFoundException("Esta empresa não tem contrato de licenciamento.");
    return { ...contrato, previa: await this.apurar(clienteId, competenciaDe(new Date())) };
  }

  /**
   * Quantas balanças a competência tem, e quanto isso dá. Só leitura: serve de
   * prévia antes do fechamento e de conferência depois.
   *
   * Conta as balanças CADASTRADAS até o fim do mês (decisão comercial): o que
   * vale é a balança existir no sistema, não ter ficado online.
   */
  async apurar(clienteId: string, competencia: string) {
    const contrato = await this.prisma.contratoLicenciamento.findUnique({ where: { clienteId } });
    if (!contrato) throw new NotFoundException("Esta empresa não tem contrato de licenciamento.");

    const corte = fimDaCompetencia(competencia);
    const quantidade = await this.prisma.device.count({
      where: { clienteId, createdAt: { lt: corte } },
    });
    const cobranca = calcularCobranca(quantidade, Number(contrato.valorUnitario), contrato.quantidadeMinima);
    return { competencia, ...cobranca, dataVencimento: vencimentoDaCompetencia(competencia, contrato.diaVencimento) };
  }

  /**
   * Fecha a competência e emite a cobrança no Asaas.
   *
   * Idempotente pela chave [contrato, competência]: rodar duas vezes devolve a
   * competência já fechada em vez de cobrar de novo. O valor unitário é
   * congelado na linha — mudar o preço do contrato depois não reescreve o que
   * já foi faturado.
   */
  async fechar(clienteId: string, competencia: string, cpfCnpj?: string) {
    const contrato = await this.prisma.contratoLicenciamento.findUnique({ where: { clienteId } });
    if (!contrato) throw new NotFoundException("Esta empresa não tem contrato de licenciamento.");
    if (!contrato.ativo) throw new BadRequestException("Contrato inativo.");

    const jaFechada = await this.prisma.competenciaFaturada.findUnique({
      where: { contratoId_competencia: { contratoId: contrato.id, competencia } },
    });
    // Já cobrada: devolve como está (idempotência). Mas competência que ficou
    // só apurada — porque a chamada ao Asaas falhou — precisa ser retomada,
    // senão o mês é dado como fechado e nunca chega a ser cobrado.
    if (jaFechada?.asaasPaymentId) return jaFechada;

    const agora = new Date();
    if (fimDaCompetencia(competencia) > agora) {
      throw new BadRequestException("A competência ainda não terminou. Feche depois do último dia do mês.");
    }

    const apuracao = await this.apurar(clienteId, competencia);

    // Grava ANTES de cobrar: se a chamada ao Asaas falhar, a competência fica
    // registrada como apurada e o retry não duplica a cobrança.
    const linha =
      jaFechada ??
      (await this.prisma.competenciaFaturada.create({
        data: {
          contratoId: contrato.id,
          competencia,
          quantidadeApurada: apuracao.quantidadeApurada,
          quantidadeFaturada: apuracao.quantidadeFaturada,
          valorUnitario: apuracao.valorUnitario,
          valorTotal: apuracao.valorTotal,
          dataVencimento: apuracao.dataVencimento,
        },
      }));

    const cliente = await this.prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
    let asaasCustomerId = contrato.asaasCustomerId;
    if (!asaasCustomerId) {
      if (!cpfCnpj) {
        throw new BadRequestException("Informe o CNPJ da fabricante para emitir a primeira cobrança.");
      }
      const customer = await this.asaas.createCustomer({
        name: cliente.nome,
        cpfCnpj,
        externalReference: `contrato:${cliente.id}`,
      });
      asaasCustomerId = customer.id;
      await this.prisma.contratoLicenciamento.update({ where: { id: contrato.id }, data: { asaasCustomerId } });
    }

    // A competência já gravada manda no valor: se o preço do contrato mudou
    // entre a apuração e o retry, o mês fechado não se reescreve.
    const cobranca = await this.asaas.createPayment({
      customer: asaasCustomerId,
      billingType: "BOLETO",
      value: Number(linha.valorTotal),
      dueDate: new Date(linha.dataVencimento).toISOString().slice(0, 10),
      description: `PesoHub — licenciamento ${competencia}: ${apuracao.quantidadeFaturada} balança(s) x R$ ${apuracao.valorUnitario}`,
      externalReference: `${contrato.id}:${competencia}`,
    });

    return this.prisma.competenciaFaturada.update({
      where: { id: linha.id },
      data: { status: "COBRADA", asaasPaymentId: cobranca.id, linkPagamento: cobranca.invoiceUrl ?? null },
    });
  }
}
