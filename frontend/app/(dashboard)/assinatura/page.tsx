"use client";

import { useEffect, useState } from "react";
import { CreditCard, QrCode, FileText, Loader2, AlertTriangle } from "lucide-react";
import { billingApi, ApiError, type Assinatura, type FormaPagamentoAssinatura } from "../../../lib/api";

const FORMAS_PAGAMENTO: { value: FormaPagamentoAssinatura; label: string; icon: typeof QrCode }[] = [
  { value: "PIX", label: "Pix", icon: QrCode },
  { value: "BOLETO", label: "Boleto", icon: FileText },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito", icon: CreditCard },
];

const STATUS_LABEL: Record<Assinatura["status"], { label: string; className: string }> = {
  TRIAL: { label: "Período de teste", className: "bg-slate-100 text-slate-700" },
  ATIVA: { label: "Ativa", className: "bg-emerald-50 text-emerald-700" },
  INADIMPLENTE: { label: "Inadimplente", className: "bg-red-50 text-red-600" },
  CANCELADA: { label: "Cancelada", className: "bg-slate-100 text-slate-500" },
};

export default function AssinaturaPage() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoAssinatura>("PIX");
  const [valor, setValor] = useState("199.90");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [saving, setSaving] = useState(false);

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
      await billingApi.subscribe({ formaPagamento, valor: Number(valor), cpfCnpj: cpfCnpj || undefined });
      setNotice("Assinatura criada com sucesso.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a assinatura.");
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Assinatura</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie a cobrança mensal do PesoHub via Asaas.</p>
      </div>

      {notice && (
        <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">{notice}</div>
      )}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}

      {assinatura ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Status</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_LABEL[assinatura.status].className}`}>
              {STATUS_LABEL[assinatura.status].label}
            </span>
          </div>

          {assinatura.status === "INADIMPLENTE" && (
            <div className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Pagamento em atraso. O acesso ao sistema fica bloqueado até a regularização. Verifique a última fatura
                abaixo.
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Forma de pagamento</span>
            <span className="text-slate-800 font-medium">
              {FORMAS_PAGAMENTO.find((f) => f.value === assinatura.formaPagamento)?.label}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Valor mensal</span>
            <span className="text-slate-800 font-medium">
              {Number(assinatura.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          {assinatura.proximoVencimento && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Próximo vencimento</span>
              <span className="text-slate-800 font-medium">
                {new Date(assinatura.proximoVencimento).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}

          {assinatura.faturas.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Faturas recentes</h3>
              <ul className="divide-y divide-slate-100">
                {assinatura.faturas.map((f) => (
                  <li key={f.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-600">
                      {Number(f.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className="text-slate-500">{f.status}</span>
                    {f.linkPagamento && (
                      <a
                        href={f.linkPagamento}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        Ver fatura
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assinatura.status !== "CANCELADA" && (
            <button
              onClick={handleCancel}
              disabled={saving}
              className="w-full mt-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
            >
              Cancelar assinatura
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
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
            <label htmlFor="assinatura-valor-mensal-r" className="block text-sm font-medium text-slate-700 mb-2">Valor mensal (R$)</label>
            <input id="assinatura-valor-mensal-r"
              type="number"
              step="0.01"
              min="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="assinatura-cpf-ou-cnpj" className="block text-sm font-medium text-slate-700 mb-2">CPF ou CNPJ</label>
            <input id="assinatura-cpf-ou-cnpj"
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
            className="w-full flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar"}
          </button>
        </form>
      )}
    </div>
  );
}
