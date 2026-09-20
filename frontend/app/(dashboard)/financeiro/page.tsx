"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Search,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  billingApi,
  ApiError,
  getCurrentUser,
  type PainelFinanceiro,
  type PainelAssinatura,
  type PainelContrato,
  type SituacaoCobranca,
} from "../../../lib/api";

const dinheiro = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

const SITUACAO: Record<SituacaoCobranca, { rotulo: string; classe: string }> = {
  ATIVA: { rotulo: "Em dia", classe: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  AGUARDANDO: { rotulo: "Aguardando 1º pagamento", classe: "bg-sky-50 text-sky-700 ring-sky-200" },
  ATRASADA: { rotulo: "Em atraso", classe: "bg-amber-50 text-amber-700 ring-amber-200" },
  BLOQUEADA: { rotulo: "Bloqueada", classe: "bg-red-50 text-red-700 ring-red-200" },
  CANCELADA: { rotulo: "Cancelada", classe: "bg-slate-100 text-slate-600 ring-slate-200" },
};

const STATUS_COMPETENCIA: Record<string, { rotulo: string; classe: string }> = {
  APURADA: { rotulo: "Apurada (sem cobrança)", classe: "bg-slate-100 text-slate-600 ring-slate-200" },
  COBRADA: { rotulo: "Cobrada", classe: "bg-sky-50 text-sky-700 ring-sky-200" },
  PAGA: { rotulo: "Paga", classe: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  VENCIDA: { rotulo: "Vencida", classe: "bg-red-50 text-red-700 ring-red-200" },
  CANCELADA: { rotulo: "Cancelada", classe: "bg-slate-100 text-slate-600 ring-slate-200" },
};

export default function FinanceiroPage() {
  const [painel, setPainel] = useState<PainelFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<SituacaoCobranca | "TODAS">("TODAS");
  const [fechamento, setFechamento] = useState<{ contrato: PainelContrato; competencia: string } | null>(null);

  const currentUser = getCurrentUser();

  const carregar = () => {
    setLoading(true);
    billingApi
      .painel()
      .then((p) => {
        setPainel(p);
        setErro("");
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : "Não foi possível carregar o painel."))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const assinaturas = useMemo(() => {
    if (!painel) return [];
    const termo = busca.trim().toLowerCase();
    return painel.assinaturas.filter(
      (a) =>
        (filtro === "TODAS" || a.situacao === filtro) &&
        (!termo || a.empresa.toLowerCase().includes(termo) || (a.rede ?? "").toLowerCase().includes(termo)),
    );
  }, [painel, busca, filtro]);

  if (currentUser && currentUser.role !== "SUPERADMIN") {
    return (
      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Financeiro</h2>
        <p className="text-sm text-slate-500">
          Cobrança de toda a base: contratos de licenciamento e assinaturas das redes.
        </p>
      </div>

      {erro && (
        <div className="flex items-start gap-2.5 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}
      {aviso && (
        <div className="flex items-start gap-2.5 p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{aviso}</span>
          <button type="button" onClick={() => setAviso("")} aria-label="Fechar aviso" className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && !painel ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white border border-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : painel ? (
        <>
          {/* Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador
              titulo="Receita mensal prevista"
              valor={dinheiro(painel.resumo.receitaMensalPrevista)}
              detalhe={`${dinheiro(painel.resumo.mensalidadeContratos)} de licenciamento · ${dinheiro(painel.resumo.mensalidadeRedes)} de redes`}
              icone={<TrendingUp className="w-4 h-4" />}
              cor="text-brand-600 bg-brand-50"
            />
            <Indicador
              titulo="Recebido neste mês"
              valor={dinheiro(painel.resumo.recebidoNoMes)}
              detalhe="Competências com pagamento confirmado"
              icone={<Wallet className="w-4 h-4" />}
              cor="text-emerald-600 bg-emerald-50"
            />
            <Indicador
              titulo="Em atraso"
              valor={dinheiro(painel.resumo.emAtraso)}
              detalhe={`${painel.resumo.assinaturasEmAtraso} assinatura(s) e competências vencidas`}
              icone={<AlertTriangle className="w-4 h-4" />}
              cor={painel.resumo.emAtraso > 0 ? "text-red-600 bg-red-50" : "text-slate-500 bg-slate-100"}
            />
            <Indicador
              titulo="Clientes cobrando"
              valor={`${painel.resumo.assinaturasAtivas + painel.resumo.contratosAtivos}`}
              detalhe={`${painel.resumo.contratosAtivos} contrato(s) · ${painel.resumo.assinaturasAtivas} rede(s) em dia · ${painel.resumo.assinaturasAguardando} aguardando`}
              icone={<Clock className="w-4 h-4" />}
              cor="text-sky-600 bg-sky-50"
            />
          </div>

          {/* Contratos de licenciamento */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Contratos de licenciamento</h3>
              <p className="text-xs text-slate-500">Fabricantes que pagam por balança, com mínimo mensal garantido.</p>
            </div>
            {painel.contratos.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-400">Nenhum contrato cadastrado.</p>
            ) : (
              painel.contratos.map((c) => (
                <div key={c.id} className="px-6 py-5 border-b border-slate-100 last:border-0">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-800">
                        {c.empresa}
                        {!c.ativo && <span className="ml-2 text-xs text-slate-400">(inativo)</span>}
                      </p>
                      <p className="text-sm text-slate-500">
                        {dinheiro(c.valorUnitario)} por balança · mínimo de {c.quantidadeMinima} · vence dia{" "}
                        {c.diaVencimento}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Prévia de {c.previa.competencia}</p>
                      <p className="text-lg font-semibold text-slate-800">{dinheiro(c.previa.valorTotal)}</p>
                      <p className="text-xs text-slate-500">
                        {c.previa.quantidadeApurada} cadastrada(s) · {c.previa.quantidadeFaturada} faturável(is)
                        {c.previa.quantidadeApurada < c.quantidadeMinima && " pelo mínimo"}
                      </p>
                    </div>
                  </div>

                  {c.competencias.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-wide text-slate-400">
                          <tr>
                            <th className="py-2 font-medium">Competência</th>
                            <th className="py-2 font-medium">Balanças</th>
                            <th className="py-2 font-medium">Valor</th>
                            <th className="py-2 font-medium">Vencimento</th>
                            <th className="py-2 font-medium">Situação</th>
                            <th className="py-2 font-medium text-right">Boleto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {c.competencias.map((f) => {
                            const s = STATUS_COMPETENCIA[f.status] ?? STATUS_COMPETENCIA.APURADA;
                            return (
                              <tr key={f.id}>
                                <td className="py-2 font-medium text-slate-700">{f.competencia}</td>
                                <td className="py-2 text-slate-600">{f.quantidadeFaturada}</td>
                                <td className="py-2 text-slate-800">{dinheiro(f.valorTotal)}</td>
                                <td className="py-2 text-slate-600">{data(f.dataVencimento)}</td>
                                <td className="py-2">
                                  <Selo classe={s.classe}>{s.rotulo}</Selo>
                                </td>
                                <td className="py-2 text-right">
                                  {f.link ? (
                                    <a
                                      href={f.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                                    >
                                      abrir <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {c.ativo && (
                    <button
                      type="button"
                      onClick={() => setFechamento({ contrato: c, competencia: competenciaAnterior() })}
                      className="mt-4 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Fechar uma competência
                    </button>
                  )}
                </div>
              ))
            )}
          </section>

          {/* Assinaturas das redes */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden">
            <div className="flex flex-col gap-3 px-6 py-4 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Assinaturas das redes</h3>
                <p className="text-xs text-slate-500">Supermercados que pagam mensalidade por balança.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filtrar por situação"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value as SituacaoCobranca | "TODAS")}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="TODAS">Todas as situações</option>
                  {Object.entries(SITUACAO).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.rotulo}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    aria-label="Buscar empresa ou rede"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Empresa ou rede"
                    className="border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3 font-medium">Cliente</th>
                    <th className="px-6 py-3 font-medium">Balanças</th>
                    <th className="px-6 py-3 font-medium">Mensalidade</th>
                    <th className="px-6 py-3 font-medium">Vencimento</th>
                    <th className="px-6 py-3 font-medium">Situação</th>
                    <th className="px-6 py-3 font-medium text-right">Última fatura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assinaturas.map((a) => (
                    <LinhaAssinatura key={a.id} a={a} />
                  ))}
                  {assinaturas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-sm font-medium text-slate-700">
                          {painel.assinaturas.length === 0 ? "Nenhuma rede assinante ainda" : "Nada encontrado"}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {painel.assinaturas.length === 0
                            ? "As assinaturas aparecem aqui assim que um supermercado contratar."
                            : "Ajuste a busca ou o filtro de situação."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {fechamento && (
        <ModalFechamento
          contrato={fechamento.contrato}
          competenciaInicial={fechamento.competencia}
          onFechar={() => setFechamento(null)}
          onConcluido={(msg) => {
            setFechamento(null);
            setAviso(msg);
            carregar();
          }}
        />
      )}
    </div>
  );
}

/** Mês anterior ao atual: é o único que pode ser fechado hoje. */
function competenciaAnterior(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Indicador({
  titulo,
  valor,
  detalhe,
  icone,
  cor,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: React.ReactNode;
  cor: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-4">
      <div className="flex items-center gap-2">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${cor}`}>{icone}</span>
        <p className="text-xs uppercase tracking-wide text-slate-400">{titulo}</p>
      </div>
      <p className="mt-2 text-xl font-semibold text-slate-800">{valor}</p>
      <p className="mt-1 text-xs text-slate-500">{detalhe}</p>
    </div>
  );
}

function Selo({ classe, children }: { classe: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classe}`}>
      {children}
    </span>
  );
}

function LinhaAssinatura({ a }: { a: PainelAssinatura }) {
  const s = SITUACAO[a.situacao];
  const defasada = a.valorPrevisto !== a.valor && a.situacao !== "CANCELADA";
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-3.5">
        <p className="font-medium text-slate-800">{a.rede ? `@${a.rede}` : a.empresa}</p>
        {a.rede && <p className="text-xs text-slate-400">{a.empresa}</p>}
      </td>
      <td className="px-6 py-3.5 text-slate-600">
        {a.balancasCobradas}
        {defasada && (
          <span className="ml-1.5 text-xs text-amber-600" title="A quantidade mudou desde a última cobrança">
            (hoje {a.balancasHoje})
          </span>
        )}
      </td>
      <td className="px-6 py-3.5">
        <span className="text-slate-800 font-medium">{dinheiro(a.valor)}</span>
        {defasada && <span className="block text-xs text-amber-600">previsto {dinheiro(a.valorPrevisto)}</span>}
      </td>
      <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">{data(a.proximoVencimento)}</td>
      <td className="px-6 py-3.5">
        <Selo classe={s.classe}>{s.rotulo}</Selo>
      </td>
      <td className="px-6 py-3.5 text-right">
        {a.ultimaFatura ? (
          <span className="text-slate-600">
            {dinheiro(a.ultimaFatura.valor)}{" "}
            {a.ultimaFatura.link && (
              <a
                href={a.ultimaFatura.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
              >
                abrir <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
    </tr>
  );
}

/**
 * Fechar competência emite BOLETO REAL. Por isso a confirmação mostra o valor
 * calculado e exige o aceite explícito — não é um botão de um clique só.
 */
function ModalFechamento({
  contrato,
  competenciaInicial,
  onFechar,
  onConcluido,
}: {
  contrato: PainelContrato;
  competenciaInicial: string;
  onFechar: () => void;
  onConcluido: (mensagem: string) => void;
}) {
  const [competencia, setCompetencia] = useState(competenciaInicial);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const r = await billingApi.fecharCompetenciaDe(contrato.clienteId, competencia, cpfCnpj || undefined);
      onConcluido(
        `Competência ${r.competencia} fechada para ${contrato.empresa}.` +
          (r.linkPagamento ? " O boleto já está disponível na lista." : ""),
      );
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível fechar a competência.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-label="Fechar competência" className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Fechar competência</h3>
            <p className="text-sm text-slate-500">{contrato.empresa}</p>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={enviar} className="px-6 py-5 space-y-4">
          {erro && (
            <div className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="p-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg">
            Isso emite uma <strong>cobrança real</strong> no Asaas, com vencimento no dia {contrato.diaVencimento} do mês
            seguinte. Só é possível fechar um mês que já terminou, e cada mês só pode ser fechado uma vez.
          </div>

          <div>
            <label htmlFor="competencia" className="block text-sm font-medium text-slate-700 mb-1">
              Competência (AAAA-MM)
            </label>
            <input
              id="competencia"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              pattern="\d{4}-\d{2}"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Cobra {dinheiro(contrato.valorUnitario)} por balança, respeitando o mínimo de {contrato.quantidadeMinima}.
            </p>
          </div>

          {!contrato.temClienteNoAsaas && (
            <div>
              <label htmlFor="cpfCnpj" className="block text-sm font-medium text-slate-700 mb-1">
                CNPJ da empresa
              </label>
              <input
                id="cpfCnpj"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                required
                placeholder="Apenas números"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-slate-500">Exigido só na primeira cobrança desta empresa.</p>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Confirmo a emissão da cobrança para esta competência.</span>
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="mt-3 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || !confirmado}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
              {salvando ? "Emitindo..." : "Emitir cobrança"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
