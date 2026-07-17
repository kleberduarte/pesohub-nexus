"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, Download, Upload, MoreVertical, X, Save } from "lucide-react";
import { productsApi, getCurrentUser, type Product, type CreateProductInput, ApiError } from "../../../lib/api";

const emptyForm: CreateProductInput = {
  codigo: "",
  codigoBarras: "",
  nome: "",
  preco: 0,
  categoriaImposto: "",
  ativo: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateProductInput>(emptyForm);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    if (!getCurrentUser()?.clienteId) {
      setError("Nenhuma empresa selecionada. Escolha uma empresa cadastrada para ver os produtos.");
      setLoading(false);
      return;
    }
    try {
      setProducts(await productsApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await productsApi.create(form);
      setIsModalOpen(false);
      setForm(emptyForm);
      await loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800">Produtos (PLU)</h2>

        <div className="flex space-x-3 w-full sm:w-auto">
          <button className="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
            <Upload className="w-4 h-4 mr-2" />
            Importar (CSV/Excel)
          </button>
          <button className="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por PLU, código, EAN-13 ou nome..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Código</th>
                <th className="px-6 py-4 font-medium">EAN-13</th>
                <th className="px-6 py-4 font-medium">Nome do Produto</th>
                <th className="px-6 py-4 font-medium">Categoria de Imposto</th>
                <th className="px-6 py-4 font-medium">Ativo</th>
                <th className="px-6 py-4 font-medium">Preço Unit.</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Carregando produtos...
                  </td>
                </tr>
              )}
              {!loading &&
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-mono">{product.codigo}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{product.codigoBarras}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{product.nome}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {product.categoriaImposto ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{product.ativo ? "Sim" : "Não"}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {product.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>{products.length} produto(s)</span>
        </div>
      </div>

      {/* PLU Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Cadastro de Produto (PLU)</h3>
                <p className="text-sm text-slate-500">Preencha as informações do item, incluindo o código de barras EAN-13</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="contents">
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informações Básicas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Código do Produto</label>
                        <input
                          type="text"
                          required
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.codigo}
                          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Código de Barras (EAN-13)</label>
                        <input
                          type="text"
                          required
                          maxLength={13}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 font-mono"
                          value={form.codigoBarras}
                          onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Categoria de Imposto</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.categoriaImposto}
                          onChange={(e) => setForm({ ...form, categoriaImposto: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Nome do Produto</label>
                        <input
                          type="text"
                          required
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.nome}
                          onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Preço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Preço Unitário (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.preco}
                          onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ativo</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.ativo ? "sim" : "nao"}
                          onChange={(e) => setForm({ ...form, ativo: e.target.value === "sim" })}
                        >
                          <option value="sim">Sim</option>
                          <option value="nao">Não</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end space-x-3 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center disabled:opacity-60"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
