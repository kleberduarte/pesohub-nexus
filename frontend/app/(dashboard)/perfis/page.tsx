"use client";

import { useEffect, useState } from "react";
import { IdCard, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  ApiError,
  ehPerfilDeRede,
  lojasApi,
  perfisApi,
  type Loja,
  type Perfil,
} from "../../../lib/api";

/**
 * Tela de Perfis (card #87): o administrador monta o escopo de lojas sem
 * script. Perfis "Rede: ..." o sistema cria sozinho a partir do e-mail da
 * loja — aqui eles aparecem só para consulta.
 */

const inputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent";

export default function PerfisPage() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Perfil | null>(null);
  const [nome, setNome] = useState("");
  const [lojaIds, setLojaIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [apagar, setApagar] = useState<Perfil | null>(null);
  const [deleting, setDeleting] = useState(false);

  const carregar = () => {
    setLoading(true);
    Promise.all([perfisApi.list(), lojasApi.list()])
      .then(([p, l]) => {
        setPerfis(p);
        setLojas(l);
        setError("");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não foi possível carregar os perfis."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirNovo = () => {
    setEditando(null);
    setNome("");
    setLojaIds([]);
    setFormError("");
    setModalAberto(true);
  };

  const abrirEdicao = (perfil: Perfil) => {
    setEditando(perfil);
    setNome(perfil.nome);
    setLojaIds(perfil.lojas.map((l) => l.lojaId));
    setFormError("");
    setModalAberto(true);
  };

  const fechar = () => {
    setModalAberto(false);
    setEditando(null);
    setFormError("");
  };

  const alternarLoja = (id: string) => {
    setLojaIds((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (lojaIds.length === 0) {
      setFormError("Marque ao menos uma loja. Quem deve ver todas as lojas atuais e futuras fica sem perfil.");
      return;
    }
    setSaving(true);
    try {
      if (editando) {
        await perfisApi.update(editando.id, { nome, lojaIds });
        setAviso("Perfil atualizado.");
      } else {
        await perfisApi.create({ nome, lojaIds });
        setAviso("Perfil criado.");
      }
      fechar();
      carregar();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!apagar) return;
    setDeleting(true);
    setError("");
    try {
      await perfisApi.remove(apagar.id);
      setAviso("Perfil excluído.");
      setApagar(null);
      carregar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível excluir o perfil.");
      setApagar(null);
    } finally {
      setDeleting(false);
    }
  };

  const nomeDasLojas = (perfil: Perfil) => {
    const nomes = perfil.lojas.map((l) => l.loja?.nome).filter(Boolean) as string[];
    if (nomes.length === 0) return "Nenhuma loja";
    return nomes.join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Perfis</h1>
          <p className="text-slate-500 text-sm mt-1">
            O perfil diz em quais lojas a pessoa trabalha. Sem perfil, ela vê a empresa inteira — inclusive lojas que
            ainda forem abertas.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo perfil
        </button>
      </div>

      {aviso && (
        <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg" role="status">
          {aviso}
        </div>
      )}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : perfis.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum perfil ainda. Crie o primeiro para restringir o acesso por loja.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Lojas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perfis.map((perfil) => {
                const automatico = ehPerfilDeRede(perfil.nome);
                return (
                  <tr key={perfil.id}>
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-slate-400" />
                        {perfil.nome}
                      </span>
                      {automatico && (
                        <span className="ml-2 text-xs font-normal text-slate-400">automático da rede</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{nomeDasLojas(perfil)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        disabled={automatico}
                        onClick={() => abrirEdicao(perfil)}
                        title={automatico ? "Perfis de rede não se editam" : "Editar perfil"}
                        aria-label={automatico ? "Perfis de rede não se editam" : "Editar perfil"}
                        className="text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-400"
                      >
                        <Pencil className="w-4 h-4 inline" />
                      </button>
                      <button
                        type="button"
                        disabled={automatico}
                        onClick={() => setApagar(perfil)}
                        title={automatico ? "Perfis de rede não se excluem" : "Excluir perfil"}
                        aria-label={automatico ? "Perfis de rede não se excluem" : "Excluir perfil"}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-label={editando ? "Editar perfil" : "Novo perfil"} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-800">{editando ? "Editar perfil" : "Novo perfil"}</h3>
                <p className="text-sm text-slate-500">Nome e as lojas que quem tiver este perfil enxerga.</p>
              </div>
              <button type="button" onClick={fechar} aria-label="Fechar" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={salvar} className="px-6 py-5 space-y-4">
              {formError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3" role="alert">
                  {formError}
                </p>
              )}
              <div>
                <label htmlFor="perfil-nome" className="block text-sm font-medium text-slate-700 mb-1">
                  Nome
                </label>
                <input
                  id="perfil-nome"
                  required
                  maxLength={120}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputClass}
                />
              </div>
              <fieldset>
                <legend className="block text-sm font-medium text-slate-700 mb-2">Lojas</legend>
                {lojas.length === 0 ? (
                  <p className="text-sm text-slate-500">Cadastre uma loja antes de montar o perfil.</p>
                ) : (
                  <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                    {lojas.map((loja) => (
                      <label key={loja.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={lojaIds.includes(loja.id)}
                          onChange={() => alternarLoja(loja.id)}
                        />
                        {loja.nome}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={fechar}
                  className="mt-3 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="mt-3 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {apagar && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-label="Excluir perfil" className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-slate-800">Excluir perfil</h3>
            <p className="mt-2 text-sm text-slate-600">
              Excluir <strong>{apagar.nome}</strong>? Só funciona se ninguém estiver usando este perfil.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setApagar(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-sm rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmarExclusao()}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg font-semibold disabled:opacity-60"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
