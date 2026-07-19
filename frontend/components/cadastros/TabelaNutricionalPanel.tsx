"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  tabelasNutricionaisApi,
  ApiError,
  type TabelaNutricional,
  type TabelaNutricionalItem,
  type NutrienteUnidade,
} from "../../lib/api";
import { ConfirmDialog } from "../ui/ConfirmDialog";

const UNIDADES: { value: NutrienteUnidade; label: string }[] = [
  { value: "KCAL_KJ", label: "kcal e kj" },
  { value: "G", label: "g" },
  { value: "MG", label: "mg" },
  { value: "MCG", label: "mcg" },
];

const MAX_ITENS = 17;

function emptyItem(ordem: number): TabelaNutricionalItem {
  return { ordem, ingrediente: "", unidade: "G", valor: 0, porcentagem: 0 };
}

export function TabelaNutricionalPanel() {
  const [tabelas, setTabelas] = useState<TabelaNutricional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TabelaNutricional | null>(null);
  const [numero, setNumero] = useState(0);
  const [nome, setNome] = useState("");
  const [porcao, setPorcao] = useState("");
  const [itens, setItens] = useState<TabelaNutricionalItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TabelaNutricional | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    tabelasNutricionaisApi
      .list()
      .then(setTabelas)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar tabelas."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setNumero(0);
    setNome("");
    setPorcao("");
    setItens([emptyItem(1)]);
    setModalOpen(true);
  };

  const openEdit = (t: TabelaNutricional) => {
    setEditing(t);
    setNumero(t.numero);
    setNome(t.nome);
    setPorcao(t.porcao ?? "");
    setItens(t.itens.length > 0 ? t.itens : [emptyItem(1)]);
    setModalOpen(true);
  };

  const addItem = () => {
    if (itens.length >= MAX_ITENS) return;
    setItens([...itens, emptyItem(itens.length + 1)]);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index).map((it, i) => ({ ...it, ordem: i + 1 })));
  };

  const updateItem = (index: number, patch: Partial<TabelaNutricionalItem>) => {
    setItens(itens.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { numero, nome, porcao, itens: itens.filter((it) => it.ingrediente.trim() !== "") };
      if (editing) {
        await tabelasNutricionaisApi.update(editing.id, payload);
      } else {
        await tabelasNutricionaisApi.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar tabela nutricional.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await tabelasNutricionaisApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir tabela nutricional.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Tabela Nutricional</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Número</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Porção</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Ingredientes</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            ) : tabelas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma tabela nutricional cadastrada.
                </td>
              </tr>
            ) : (
              tabelas.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">{t.numero}</td>
                  <td className="px-4 py-3">{t.nome}</td>
                  <td className="px-4 py-3">{t.porcao ?? "-"}</td>
                  <td className="px-4 py-3">{t.itens.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editing ? "Editar Tabela Nutricional" : "Nova Tabela Nutricional"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número *</label>
                <input
                  type="number"
                  value={numero}
                  onChange={(e) => setNumero(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Porção</label>
                <input
                  type="text"
                  placeholder="Porção de 30g"
                  value={porcao}
                  onChange={(e) => setPorcao(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Ingredientes ({itens.length}/{MAX_ITENS})
              </label>
              <button
                type="button"
                onClick={addItem}
                disabled={itens.length >= MAX_ITENS}
                className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Adicionar linha
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-500">Ingrediente</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-500 w-28">Unidade</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-500 w-24">Valor</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-500 w-24">%</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={item.ingrediente}
                          onChange={(e) => updateItem(index, { ingrediente: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={item.unidade}
                          onChange={(e) => updateItem(index, { unidade: e.target.value as NutrienteUnidade })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        >
                          {UNIDADES.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={item.valor}
                          onChange={(e) => updateItem(index, { valor: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={item.porcentagem}
                          onChange={(e) => updateItem(index, { porcentagem: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !nome}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Tabela Nutricional"
        message="Tem certeza que deseja excluir esta tabela nutricional? Essa ação não pode ser desfeita."
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
