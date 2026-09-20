/**
 * Regras de preço do PesoHub (card #97).
 *
 * Tudo aqui é função pura e vive no backend de propósito: o valor a cobrar
 * nunca pode vir da tela. Quem manda é a quantidade de balanças, o preço
 * unitário acordado e o mínimo contratado.
 *
 * Dois contratos distintos usam as mesmas contas:
 * - fabricante (Ramuza): R$ 40 por balança, mínimo 400 por mês;
 * - cliente final (rede de supermercado): R$ 40 por balança, mínimo 1.
 */

export interface Cobranca {
  /** Balanças realmente encontradas. */
  quantidadeApurada: number;
  /** O que se cobra: a maior entre a apurada e o mínimo do contrato. */
  quantidadeFaturada: number;
  valorUnitario: number;
  valorTotal: number;
}

/** Centavos, para não somar dinheiro em ponto flutuante. */
function emCentavos(valor: number): number {
  return Math.round(valor * 100);
}

export function calcularCobranca(
  quantidadeApurada: number,
  valorUnitario: number,
  quantidadeMinima: number,
): Cobranca {
  if (!Number.isInteger(quantidadeApurada) || quantidadeApurada < 0) {
    throw new Error("Quantidade de balanças inválida");
  }
  if (!Number.isInteger(quantidadeMinima) || quantidadeMinima < 0) {
    throw new Error("Quantidade mínima inválida");
  }
  if (!(valorUnitario > 0)) {
    throw new Error("Valor unitário inválido");
  }

  const quantidadeFaturada = Math.max(quantidadeApurada, quantidadeMinima);
  const valorTotal = (emCentavos(valorUnitario) * quantidadeFaturada) / 100;
  return { quantidadeApurada, quantidadeFaturada, valorUnitario, valorTotal };
}

/** Competência no formato AAAA-MM (o mês de referência da fatura). */
export function competenciaDe(data: Date): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Instante logo após o último dia da competência — o corte da apuração. */
export function fimDaCompetencia(competencia: string): Date {
  const [ano, mes] = competencia.split("-").map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) throw new Error("Competência inválida (use AAAA-MM)");
  return new Date(Date.UTC(ano, mes, 1));
}

/**
 * Vencimento da competência: o dia combinado, no mês seguinte ao fechamento.
 * Um dia que não existe no mês cai no último dia dele (31 em fevereiro = 28/29).
 */
export function vencimentoDaCompetencia(competencia: string, diaVencimento: number): Date {
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimoDiaDoMesSeguinte = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(diaVencimento, ultimoDiaDoMesSeguinte)));
}

/**
 * Dias de tolerância após o vencimento antes de travar a edição (card #97).
 * Mora aqui, junto das regras de cobrança, porque o guard, o painel e a tela
 * de Assinatura precisam contar o MESMO prazo — três cópias da constante
 * dariam três respostas diferentes sobre quando a rede trava.
 */
export const DIAS_DE_CARENCIA = 7;

/**
 * Data em que a inadimplência passa a bloquear. Null quando não há vencimento
 * conhecido — nesse caso nada trava.
 */
export function limiteDeCarencia(vencimento: Date | null, diasDeCarencia = DIAS_DE_CARENCIA): Date | null {
  if (!vencimento) return null;
  return new Date(vencimento.getTime() + diasDeCarencia * 24 * 60 * 60 * 1000);
}

/**
 * Bloqueio por inadimplência: só depois da carência, e a competência é sempre
 * contada a partir do vencimento. Antes disso a rede segue trabalhando.
 */
export function bloqueiaPorAtraso(
  vencimento: Date | null,
  diasDeCarencia: number,
  agora: Date,
): boolean {
  const limite = limiteDeCarencia(vencimento, diasDeCarencia);
  return limite !== null && agora > limite;
}
