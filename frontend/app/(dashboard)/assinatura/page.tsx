"use client";

import { useEffect, useState } from "react";
import { CreditCard, QrCode, FileText, Loader2, AlertTriangle, Check, Info, Scale } from "lucide-react";
import {
  billingApi,
  getCurrentUser,
  ApiError,
  type Assinatura,
  type FormaPagamentoAssinatura,
} from "../../../lib/api";

const FORMAS_PAGAMENTO: { value: FormaPagamentoAssinatura; label: string; icon: typeof QrCode }[] = [
  { value: "PIX", label: "Pix", icon: QrCode },
  { value: "BOLETO", label: "Boleto", icon: FileText },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito", icon: CreditCard },
];

/**
 * O selo do topo fala da COBRANÇA, não do cadastro: "aguardando ativação" é
 * diferente de "ativa", e quem está em atraso precisa saber se já travou ou
 * ainda está na carência. O backend manda essa situação pronta (card #99),
 * calculada pela mesma função que o guard usa para bloquear.
 */
const SITUACAO_LABEL: Record<string, { label: string; className: string }> = {
  ATIVA: { label: "Ativa", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  AGUARDANDO: { label: "Aguardando ativação", className: "bg-amber-50 text-amber-700 border-amber-100" },
  ATRASADA: { label: "Pagamento em atraso", className: "bg-amber-50 text-amber-700 border-amber-100" },
  BLOQUEADA: { label: "Bloqueada por atraso", className: "bg-red-50 text-red-600 border-red-100" },
  CANCELADA: { label: "Cancelada", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

const STATUS_FATURA_LABEL: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Aguardando pagamento", className: "text-amber-700" },
  CONFIRMADA: { label: "Confirmada", className: "text-emerald-700" },
  RECEBIDA: { label: "Paga", className: "text-emerald-700" },
  VENCIDA: { label: "Vencida", className: "text-red-600" },
  CANCELADA: { label: "Cancelada", className: "text-slate-400" },
};

const real = (valor: number | string) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Vencimento é data de CALENDÁRIO, não instante: o Asaas manda "2026-09-10",
 * que vira meia-noite UTC. Formatar no fuso de Brasília (UTC-3) exibiria 21h
 * do dia ANTERIOR — a tela mostraria o vencimento um dia mais cedo do que o
 * real. Por isso, UTC.
 */
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export default function AssinaturaPage() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoAssinatura>("PIX");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [saving, setSaving] = useState(false);
  // Cancelar é irreversível pela tela: pede confirmação explicando o efeito.
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setAssinatura(await billingApi.status());
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setAssinatura(null);
      } else {
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar a assinatura.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await billingApi.subscribe({ formaPagamento, cpfCnpj });
      setNotice("Assinatura ativada. A primeira cobrança chega por e-mail.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível ativar a assinatura.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    setError("");
    try {
      await billingApi.cancel();
      setNotice("Assinatura cancelada.");
      setConfirmandoCancelamento(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cancelar a assinatura.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // Quem administra a EMPRESA não tem assinatura: a conta é de cada rede de
  // supermercado. Sem este recorte, quem chegasse pela URL encontrava um
  // formulário de ativação que o backend recusa ("informe a rede") — o mesmo
  // formulário frio que o card #99 veio tirar do caminho, só que do público
  // errado. O menu já não traz ninguém para cá; isto cobre a URL digitada.
  const papel = getCurrentUser()?.role;
  const telaDeOutroPublico = !assinatura && (papel === "ADMIN" || papel === "SUPERADMIN");

  const situacao = assinatura?.bloqueio?.situacao ?? (assinatura?.status === "ATIVA" ? "ATIVA" : "AGUARDANDO");
  const selo = SITUACAO_LABEL[situacao] ?? SITUACAO_LABEL.AGUARDANDO;
  const precisaAtivar = !telaDeOutroPublico && (Boolean(assinatura?.aguardandoAtivacao) || !assinatura);
  const previa = assinatura?.previa;
  // A prévia só vira aviso quando REALMENTE muda o que vai ser cobrado — do
  // contrário seria um alerta permanente dizendo que nada mudou.
  const mudancaNaProxima =
    previa && assinatura && previa.valorTotal !== Number(assinatura.valor) ? previa : null;
  const vencida = situacao === "ATRASADA" || situacao === "BLOQUEADA";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Assinatura</h1>
        <p className="text-slate-500 text-sm mt-1">
          A mensalidade do supermercado{assinatura?.dominioRede ? ` @${assinatura.dominioRede}` : ""}: quanto é, como é
          calculada e quando vence.
        </p>
      </div>

      {notice && (
        <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">{notice}</div>
      )}
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>}

      {telaDeOutroPublico && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-slate-400" />
          <div className="text-sm space-y-2">
            <p className="text-slate-800 font-medium">Esta tela é a conta do supermercado, não da empresa.</p>
            <p className="text-slate-600">
              Cada rede de supermercado tem a própria assinatura, e quem a vê é o Administrador da loja, com o e-mail do
              domínio da rede. A cobrança de todas as redes, junto com o contrato de licenciamento, fica no painel
              Financeiro.
            </p>
            {papel === "SUPERADMIN" && (
              <a href="/financeiro" className="inline-block text-brand-600 hover:underline font-medium">
                Ir para o Financeiro
              </a>
            )}
          </div>
        </div>
      )}

      {assinatura && (
        <>
          {/* Topo: o que se paga e quando. É a pergunta que traz a pessoa aqui. */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-sm text-slate-500">Mensalidade</span>
                <p className="text-3xl font-semibold text-slate-800 mt-1">{real(assinatura.valor)}</p>
                {/* Vencido é passado: chamar de "próxima cobrança" uma data
                    que já passou faz a pessoa achar que ainda há prazo. */}
                <p className="text-sm text-slate-500 mt-1">
                  {!assinatura.proximoVencimento
                    ? "Sem cobrança agendada"
                    : vencida
                      ? `Venceu em ${data(assinatura.proximoVencimento)}`
                      : `Próxima cobrança em ${data(assinatura.proximoVencimento)}`}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${selo.className}`}>{selo.label}</span>
            </div>

            {!precisaAtivar && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-500">Forma de pagamento</span>
                <span className="text-slate-800 font-medium">
                  {FORMAS_PAGAMENTO.find((f) => f.value === assinatura.formaPagamento)?.label}
                </span>
              </div>
            )}
          </div>

          {/* Atraso: o que trava, o que NÃO trava, e a partir de quando. */}
          {(situacao === "ATRASADA" || situacao === "BLOQUEADA") && (
            <div
              className={`rounded-xl border p-4 ${
                situacao === "BLOQUEADA" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 shrink-0 ${situacao === "BLOQUEADA" ? "text-red-600" : "text-amber-600"}`}
                />
                <div className="space-y-2 text-sm">
                  <p className={`font-medium ${situacao === "BLOQUEADA" ? "text-red-700" : "text-amber-800"}`}>
                    {situacao === "BLOQUEADA"
                      ? "Cadastro e sincronização bloqueados por falta de pagamento."
                      : assinatura.bloqueio?.bloqueiaEm
                        ? `Pagamento em atraso. O bloqueio começa em ${data(assinatura.bloqueio.bloqueiaEm)}.`
                        : "Pagamento em atraso."}
                  </p>
                  {/* O medo de parar a operação é o que gera ligação para o
                      suporte. Dizer o que continua funcionando vale mais que
                      qualquer aviso de cobrança. */}
                  <p className="text-slate-700">
                    <strong>As balanças continuam pesando e imprimindo etiquetas normalmente</strong>, com os produtos
                    já sincronizados. O que fica travado é cadastrar ou alterar dados aqui no sistema e enviá-los para o
                    equipamento.
                  </p>
                  {assinatura.bloqueio?.diasDeCarencia ? (
                    <p className="text-slate-600">
                      São {assinatura.bloqueio.diasDeCarencia} dias de tolerância após o vencimento antes de travar.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Consumo: de onde sai o valor. Sem isso, a conta parece arbitrária. */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-400" />
              Como o valor é calculado
            </h2>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-slate-600">
                {previa?.quantidadeFaturada ?? assinatura.quantidadeBalancas} balança
                {(previa?.quantidadeFaturada ?? assinatura.quantidadeBalancas) === 1 ? "" : "s"} ×{" "}
                {real(assinatura.valorUnitario)}
              </span>
              <span className="text-slate-800 font-medium">{real(previa?.valorTotal ?? assinatura.valor)}</span>
            </div>
            {previa && previa.quantidadeApurada < previa.quantidadeFaturada && (
              <p className="text-xs text-slate-500">
                A rede tem {previa.quantidadeApurada} balança(s) cadastrada(s), mas o contrato tem mínimo de{" "}
                {assinatura.quantidadeMinima} — é o mínimo que está sendo cobrado.
              </p>
            )}
            <p className="text-xs text-slate-500">
              Cadastrou ou removeu balança, o valor das próximas cobranças acompanha. Uma cobrança já emitida não muda
              de valor no meio do caminho.
            </p>
          </div>

          {/* O que muda na próxima cobrança — só quando de fato muda. */}
          {mudancaNaProxima && (
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 flex items-start gap-3 text-sm">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-sky-600" />
              <p className="text-slate-700">
                Hoje a rede tem {mudancaNaProxima.quantidadeFaturada} balança(s) cobráveis. A próxima cobrança passa de{" "}
                <strong>{real(assinatura.valor)}</strong> para <strong>{real(mudancaNaProxima.valorTotal)}</strong>.
              </p>
            </div>
          )}
        </>
      )}

      {/* Ativação: a assinatura já existe com o valor calculado, só falta
          dizer como pagar. Nada de formulário em branco (card #99). */}
      {precisaAtivar && assinatura?.status !== "CANCELADA" && (
        <form onSubmit={handleSubscribe} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Ativar a assinatura</h2>
            <p className="text-xs text-slate-500 mt-1">
              Escolha como pagar. A cobrança é mensal e chega por e-mail; o valor é o calculado acima.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Forma de pagamento</label>
            <div className="grid grid-cols-3 gap-3">
              {FORMAS_PAGAMENTO.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setFormaPagamento(value)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    formaPagamento === value
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="assinatura-cpf-ou-cnpj" className="block text-sm font-medium text-slate-700 mb-2">
              CPF ou CNPJ
            </label>
            <input
              id="assinatura-cpf-ou-cnpj"
              type="text"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              required
              placeholder="Apenas números"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Ativando..." : "Ativar assinatura"}
          </button>
        </form>
      )}

      {assinatura && assinatura.faturas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Faturas</h2>
          <ul className="divide-y divide-slate-100">
            {assinatura.faturas.map((f) => {
              const rotulo = STATUS_FATURA_LABEL[f.status] ?? { label: f.status, className: "text-slate-500" };
              return (
                <li key={f.id} className="flex items-center gap-4 py-2.5 text-sm">
                  <span className="text-slate-800 font-medium w-24 shrink-0">{real(f.valor)}</span>
                  <span className="text-slate-500 w-36 shrink-0">
                    {f.dataVencimento ? `Venc. ${data(f.dataVencimento)}` : "—"}
                  </span>
                  <span className={`flex-1 ${rotulo.className}`}>{rotulo.label}</span>
                  {f.linkPagamento && (
                    <a
                      href={f.linkPagamento}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline shrink-0"
                    >
                      Ver fatura
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {assinatura && assinatura.status !== "CANCELADA" && !precisaAtivar && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          {confirmandoCancelamento ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                Cancelar encerra a cobrança mensal e, a partir daí, <strong>trava cadastro e sincronização</strong> para
                toda a rede. As balanças seguem pesando e imprimindo com o que já foi enviado. Para voltar, será preciso
                assinar de novo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  {saving ? "Cancelando..." : "Confirmar cancelamento"}
                </button>
                <button
                  onClick={() => setConfirmandoCancelamento(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Manter assinatura
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Cancelar a assinatura encerra a cobrança e trava cadastro e sincronização da rede.
              </p>
              <button
                onClick={() => setConfirmandoCancelamento(true)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shrink-0"
              >
                Cancelar assinatura
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
