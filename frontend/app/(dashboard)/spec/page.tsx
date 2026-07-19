"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { specParametrosApi, ApiError, type SpecParametro } from "../../../lib/api";
import { SPEC_CATALOG } from "../../../lib/spec-catalog";

export default function SpecPage() {
  const [saved, setSaved] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingNumero, setSavingNumero] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    specParametrosApi
      .list()
      .then((items: SpecParametro[]) => {
        const map: Record<number, string> = {};
        items.forEach((i) => (map[i.numero] = i.valor));
        setSaved(map);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar parâmetros."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return SPEC_CATALOG;
    return SPEC_CATALOG.filter(
      (item) => String(item.numero).includes(term) || item.descricao.toLowerCase().includes(term),
    );
  }, [search]);

  const handleSave = async (numero: number) => {
    const valor = drafts[numero] ?? saved[numero] ?? "";
    setSavingNumero(numero);
    setError(null);
    try {
      await specParametrosApi.upsert(numero, valor);
      setSaved({ ...saved, [numero]: valor });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar parâmetro.");
    } finally {
      setSavingNumero(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Especificações (SPEC)</h2>
        <p className="text-sm text-slate-500">
          Configurações avançadas da balança — formato de etiqueta, comunicação, segurança, arredondamento, entre
          outros (manual §2.1). O valor em branco assume o padrão de fábrica.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por número ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500 w-20">Número</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Descrição</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 w-40">Valor</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const current = drafts[item.numero] ?? saved[item.numero] ?? "";
                const dirty = drafts[item.numero] !== undefined && drafts[item.numero] !== (saved[item.numero] ?? "");
                return (
                  <tr key={item.numero} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{item.numero}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {item.descricao}
                      {item.valorPadrao && (
                        <span className="text-xs text-slate-400 block">Padrão de fábrica: {item.valorPadrao}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        value={current}
                        placeholder={item.valorPadrao ?? ""}
                        onChange={(e) => setDrafts({ ...drafts, [item.numero]: e.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleSave(item.numero)}
                        disabled={!dirty || savingNumero === item.numero}
                        className="p-1.5 text-slate-400 hover:text-brand-600 disabled:opacity-30 transition-colors"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
