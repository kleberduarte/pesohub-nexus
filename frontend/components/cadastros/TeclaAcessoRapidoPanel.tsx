"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Grid3x3, X } from "lucide-react";
import { teclasAcessoRapidoApi, productsApi, ApiError, type TeclaAcessoRapido, type Product } from "../../lib/api";
import { ConfirmDialog } from "../ui/ConfirmDialog";

const MODELOS = ["Atena II", "Atena II sem torre"];
const PAGINAS = [
  { value: "Modo de uma página", label: "Modo de uma página (63 teclas)", keysPerPage: 63, pages: 1 },
  { value: "Modo de duas páginas", label: "Modo de duas páginas (126 teclas)", keysPerPage: 63, pages: 2 },
  { value: "Modo de três páginas", label: "Modo de três páginas (189 teclas)", keysPerPage: 63, pages: 3 },
] as const;

const GRID_COLS = 9;
const GRID_ROWS = 7; // 9 x 7 = 63 teclas por página

interface KeyAssignment {
  codigo: string;
  nome: string;
}

function pageInfo(pagina: string) {
  return PAGINAS.find((p) => p.value === pagina) ?? PAGINAS[0];
}

function getLayoutKeys(layout: Record<string, unknown> | null | undefined): Record<string, KeyAssignment> {
  const keys = (layout as { keys?: Record<string, KeyAssignment> } | undefined)?.keys;
  return keys ?? {};
}

export function TeclaAcessoRapidoPanel() {
  const [teclas, setTeclas] = useState<TeclaAcessoRapido[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Basic (nome/modelo/pagina) modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeclaAcessoRapido | null>(null);
  const [nome, setNome] = useState("");
  const [modelo, setModelo] = useState(MODELOS[0]);
  const [pagina, setPagina] = useState<string>(PAGINAS[0].value);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeclaAcessoRapido | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Grid editor modal
  const [gridEditing, setGridEditing] = useState<TeclaAcessoRapido | null>(null);
  const [gridPage, setGridPage] = useState(0);
  const [keys, setKeys] = useState<Record<string, KeyAssignment>>({});
  const [assigningIndex, setAssigningIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [savingGrid, setSavingGrid] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([teclasAcessoRapidoApi.list(), productsApi.listForPicker()])
      .then(([t, p]) => {
        setTeclas(t);
        setProducts(p);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar teclados."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setNome("");
    setModelo(MODELOS[0]);
    setPagina(PAGINAS[0].value);
    setModalOpen(true);
  };

  const openEdit = (t: TeclaAcessoRapido) => {
    setEditing(t);
    setNome(t.nome);
    setModelo(t.modelo);
    setPagina(t.pagina);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { nome, modelo, pagina };
      if (editing) {
        await teclasAcessoRapidoApi.update(editing.id, payload);
      } else {
        await teclasAcessoRapidoApi.create({ ...payload, layout: {} });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar teclado.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await teclasAcessoRapidoApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir teclado.");
    } finally {
      setDeleting(false);
    }
  };

  const openGrid = (t: TeclaAcessoRapido) => {
    setGridEditing(t);
    setGridPage(0);
    setKeys(getLayoutKeys(t.layout));
  };

  const closeGrid = () => {
    setGridEditing(null);
    setAssigningIndex(null);
    setSearch("");
  };

  const info = gridEditing ? pageInfo(gridEditing.pagina) : PAGINAS[0];

  const handleAssign = (product: Product) => {
    if (assigningIndex === null) return;
    setKeys((prev) => ({ ...prev, [assigningIndex]: { codigo: product.codigo, nome: product.nome } }));
    setAssigningIndex(null);
    setSearch("");
  };

  const handleClearKey = (index: number) => {
    setKeys((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleSaveGrid = async () => {
    if (!gridEditing) return;
    setSavingGrid(true);
    setError(null);
    try {
      await teclasAcessoRapidoApi.update(gridEditing.id, { layout: { keys } });
      closeGrid();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar o teclado.");
    } finally {
      setSavingGrid(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.slice(0, 8);
    const q = search.toLowerCase();
    return products.filter((p) => p.codigo.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [search, products]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Tecla de Acesso Rápido</h2>
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
              <th className="text-left px-4 py-3 font-medium text-slate-500">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Modelo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Página</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Teclas atribuídas</th>
              <th className="w-32" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            ) : teclas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nenhum modelo de teclado cadastrado.
                </td>
              </tr>
            ) : (
              teclas.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">{t.nome}</td>
                  <td className="px-4 py-3">{t.modelo}</td>
                  <td className="px-4 py-3">{t.pagina}</td>
                  <td className="px-4 py-3">{Object.keys(getLayoutKeys(t.layout)).length}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openGrid(t)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Editar teclado"
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Editar nome/modelo"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Excluir"
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

      {/* Basic nome/modelo/pagina modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editing ? "Editar Teclado" : "Novo Teclado"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do modelo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
                <select
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {MODELOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Página *</label>
                <select
                  value={pagina}
                  onChange={(e) => setPagina(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {PAGINAS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
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

      {/* Visual keyboard grid editor */}
      {gridEditing && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Editar Teclado — {gridEditing.nome} ({info.keysPerPage * info.pages} teclas)
              </h3>
              <button onClick={closeGrid} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {info.pages > 1 && (
              <div className="flex gap-1 mb-4 border-b border-slate-200">
                {Array.from({ length: info.pages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setGridPage(i)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      gridPage === i
                        ? "border-brand-600 text-brand-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Página {i + 1}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 mb-3">
              Clique numa tecla para atribuir um produto (PLU), ou no × para limpar. Grade de {GRID_COLS}x{GRID_ROWS} =
              {" "}
              {GRID_COLS * GRID_ROWS} teclas por página.
            </p>

            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}>
              {Array.from({ length: info.keysPerPage }, (_, i) => {
                const globalIndex = gridPage * info.keysPerPage + i;
                const assignment = keys[globalIndex];
                return (
                  <div key={globalIndex} className="relative">
                    <button
                      onClick={() => setAssigningIndex(globalIndex)}
                      className={`w-full h-16 rounded-lg border text-[10px] leading-tight p-1 flex flex-col items-center justify-center transition-colors ${
                        assignment
                          ? "bg-brand-50 border-brand-300 text-brand-800 hover:bg-brand-100"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                      }`}
                      title={assignment ? `${assignment.codigo} — ${assignment.nome}` : "Tecla vazia"}
                    >
                      <span className="font-semibold">{globalIndex + 1}</span>
                      {assignment && <span className="truncate w-full text-center">{assignment.nome}</span>}
                    </button>
                    {assignment && (
                      <button
                        onClick={() => handleClearKey(globalIndex)}
                        className="absolute -top-1 -right-1 bg-white border border-slate-300 rounded-full w-4 h-4 flex items-center justify-center text-slate-400 hover:text-red-600"
                        title="Limpar tecla"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeGrid}
                disabled={savingGrid}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveGrid}
                disabled={savingGrid}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
              >
                {savingGrid ? "Salvando..." : "Salvar Teclado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign-product-to-key modal */}
      {assigningIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-slate-800">Atribuir Tecla {assigningIndex + 1}</h4>
              <button
                onClick={() => setAssigningIndex(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Buscar produto por código ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-3"
            />
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
              {filteredProducts.length === 0 ? (
                <p className="p-3 text-sm text-slate-400">Nenhum produto encontrado.</p>
              ) : (
                filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAssign(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
                  >
                    <span className="text-slate-700">{p.nome}</span>
                    <span className="text-xs text-slate-400 font-mono">{p.codigo}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Teclado"
        message="Tem certeza que deseja excluir este modelo de teclado? Essa ação não pode ser desfeita."
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
