"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, Search, Filter, Download, Upload, Pencil, Trash2, X, Save, Loader2, AlertTriangle } from "lucide-react";
import {
  productsApi,
  getCurrentUser,
  subSetoresApi,
  tabelasNutricionaisApi,
  fornecedoresApi,
  alergicosApi,
  imagensApi,
  type Product,
  type CreateProductInput,
  type SubSetor,
  type TabelaNutricional,
  type Fornecedor,
  type Alergico,
  type Imagem,
  ApiError,
} from "../../../lib/api";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

const emptyForm: CreateProductInput = {
  codigo: "",
  codigoBarras: "",
  nome: "",
  preco: 0,
  categoriaImposto: "",
  ativo: true,
  lote: "",
  unidadeVenda: "PESO",
  tara: undefined,
  taraPorCento: false,
  pesoFixo: false,
  desconto: undefined,
  modoEspecial: 0,
  subSetorId: "",
  tabelaNutricionalId: "",
  fornecedorId: "",
  alergicoId: "",
  imagemId: "",
  textoExtra1: "",
  textoExtra2: "",
  textoExtra3: "",
  textoExtra4: "",
  textoExtra5: "",
  textoExtra6: "",
  textoExtra7: "",
  diasDeVenda: undefined,
  tempoDeVenda: undefined,
  validadePacote: undefined,
  validadePacoteHoras: undefined,
  validadeDias: undefined,
};

type StatusFilter = "todos" | "ativos" | "inativos";

function toCsv(products: Product[]): string {
  const header = ["codigo", "codigoBarras", "nome", "preco", "categoriaImposto", "ativo"];
  const rows = products.map((p) =>
    [p.codigo, p.codigoBarras, p.nome, p.preco, p.categoriaImposto ?? "", p.ativo ? "1" : "0"]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\r\n");
}

function parseCsv(text: string): CreateProductInput[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const splitLine = (line: string) =>
    line
      .split(",")
      .map((field) => field.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));

  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const idx = {
    codigo: header.indexOf("codigo"),
    codigoBarras: header.indexOf("codigobarras"),
    nome: header.indexOf("nome"),
    preco: header.indexOf("preco"),
    categoriaImposto: header.indexOf("categoriaimposto"),
    ativo: header.indexOf("ativo"),
  };
  if (idx.codigo === -1 || idx.codigoBarras === -1 || idx.nome === -1 || idx.preco === -1) {
    throw new Error(
      'CSV inválido: cabeçalho deve conter ao menos "codigo,codigoBarras,nome,preco" (categoriaImposto e ativo são opcionais).',
    );
  }

  return lines.slice(1).map((line) => {
    const fields = splitLine(line);
    return {
      codigo: fields[idx.codigo] ?? "",
      codigoBarras: fields[idx.codigoBarras] ?? "",
      nome: fields[idx.nome] ?? "",
      preco: Number(fields[idx.preco]?.replace(",", ".") ?? 0),
      categoriaImposto: idx.categoriaImposto >= 0 ? fields[idx.categoriaImposto] : undefined,
      ativo: idx.ativo >= 0 ? fields[idx.ativo] === "1" || fields[idx.ativo]?.toLowerCase() === "true" : true,
    };
  });
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductInput>(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const DELETE_ALL_CONFIRMATION = "EXCLUIR TODOS";
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deletingOne, setDeletingOne] = useState(false);
  const [subSetores, setSubSetores] = useState<SubSetor[]>([]);
  const [tabelasNutricionais, setTabelasNutricionais] = useState<TabelaNutricional[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [alergicos, setAlergicos] = useState<Alergico[]>([]);
  const [imagens, setImagens] = useState<Imagem[]>([]);

  useEffect(() => {
    subSetoresApi.list().then(setSubSetores).catch(() => setSubSetores([]));
    tabelasNutricionaisApi.list().then(setTabelasNutricionais).catch(() => setTabelasNutricionais([]));
    fornecedoresApi.list().then(setFornecedores).catch(() => setFornecedores([]));
    alergicosApi.list().then(setAlergicos).catch(() => setAlergicos([]));
    imagensApi.list().then(setImagens).catch(() => setImagens([]));
  }, []);

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

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter === "ativos" && !p.ativo) return false;
      if (statusFilter === "inativos" && p.ativo) return false;
      if (!term) return true;
      return (
        p.codigo.toLowerCase().includes(term) ||
        p.codigoBarras.toLowerCase().includes(term) ||
        p.nome.toLowerCase().includes(term)
      );
    });
  }, [products, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setForm({
      codigo: product.codigo,
      codigoBarras: product.codigoBarras,
      nome: product.nome,
      preco: product.preco,
      categoriaImposto: product.categoriaImposto ?? "",
      ativo: product.ativo,
      lote: product.lote ?? "",
      unidadeVenda: product.unidadeVenda,
      tara: product.tara ?? undefined,
      taraPorCento: product.taraPorCento,
      pesoFixo: product.pesoFixo,
      desconto: product.desconto ?? undefined,
      modoEspecial: product.modoEspecial,
      subSetorId: product.subSetorId ?? "",
      tabelaNutricionalId: product.tabelaNutricionalId ?? "",
      fornecedorId: product.fornecedorId ?? "",
      alergicoId: product.alergicoId ?? "",
      imagemId: product.imagemId ?? "",
      textoExtra1: product.textoExtra1 ?? "",
      textoExtra2: product.textoExtra2 ?? "",
      textoExtra3: product.textoExtra3 ?? "",
      textoExtra4: product.textoExtra4 ?? "",
      textoExtra5: product.textoExtra5 ?? "",
      textoExtra6: product.textoExtra6 ?? "",
      textoExtra7: product.textoExtra7 ?? "",
      diasDeVenda: product.diasDeVenda ?? undefined,
      tempoDeVenda: product.tempoDeVenda ?? undefined,
      validadePacote: product.validadePacote ?? undefined,
      validadePacoteHoras: product.validadePacoteHoras ?? undefined,
      validadeDias: product.validadeDias ?? undefined,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await productsApi.update(editingId, form);
        setMessage("Produto atualizado com sucesso.");
      } else {
        await productsApi.create(form);
        setMessage("Produto criado com sucesso.");
      }
      setIsModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (product: Product) => setDeleteTarget(product);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingOne(true);
    setError("");
    try {
      await productsApi.remove(deleteTarget.id);
      setMessage("Produto excluído.");
      setDeleteTarget(null);
      await loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível excluir o produto.");
      setDeleteTarget(null);
    } finally {
      setDeletingOne(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteAllConfirmText !== DELETE_ALL_CONFIRMATION) return;
    setDeletingAll(true);
    setError("");
    try {
      const { deleted } = await productsApi.removeAll();
      setMessage(`${deleted} produto(s) excluído(s).`);
      setIsDeleteAllOpen(false);
      setDeleteAllConfirmText("");
      await loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível excluir os produtos.");
    } finally {
      setDeletingAll(false);
    }
  };

  const handleExport = () => {
    const csv = toCsv(filteredProducts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produtos-pesohub-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    setMessage("");
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setError("O arquivo CSV não contém nenhuma linha de produto.");
        return;
      }

      let ok = 0;
      const failures: string[] = [];
      for (const row of rows) {
        try {
          await productsApi.create(row);
          ok++;
        } catch (err) {
          failures.push(`${row.codigo || "(sem código)"}: ${err instanceof ApiError ? err.message : "erro desconhecido"}`);
        }
      }

      await loadProducts();
      if (failures.length === 0) {
        setMessage(`${ok} produto(s) importado(s) com sucesso.`);
      } else {
        setError(`${ok} importado(s), ${failures.length} falharam: ${failures.slice(0, 5).join("; ")}${failures.length > 5 ? "…" : ""}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler o arquivo CSV.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800">Produtos (PLU)</h2>

        <div className="flex space-x-3 w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
          >
            {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {importing ? "Importando..." : "Importar (CSV)"}
          </button>
          <button
            onClick={handleExport}
            disabled={filteredProducts.length === 0}
            className="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setIsDeleteAllOpen(true)}
            disabled={products.length === 0}
            className="flex items-center justify-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Todos
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por PLU, código, EAN-13 ou nome..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen((v) => !v)}
            className={`flex items-center px-4 py-2 bg-white border rounded-lg hover:bg-slate-50 transition-colors font-medium ${
              statusFilter !== "todos" ? "border-brand-400 text-brand-700" : "border-slate-200 text-slate-700"
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros{statusFilter !== "todos" ? ` (${statusFilter === "ativos" ? "Ativos" : "Inativos"})` : ""}
          </button>
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
              {(["todos", "ativos", "inativos"] as StatusFilter[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setStatusFilter(opt);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                    statusFilter === opt ? "text-brand-600 font-medium" : "text-slate-700"
                  }`}
                >
                  {opt === "todos" ? "Todos" : opt === "ativos" ? "Somente ativos" : "Somente inativos"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}
      {message && (
        <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">{message}</div>
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
                filteredProducts.map((product) => (
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
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    {products.length === 0
                      ? "Nenhum produto cadastrado."
                      : "Nenhum produto encontrado para os filtros aplicados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>
            {filteredProducts.length} de {products.length} produto(s)
          </span>
        </div>
      </div>

      {/* PLU Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingId ? "Editar Produto (PLU)" : "Cadastro de Produto (PLU)"}
                </h3>
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

                  {/* Weighing / Sale settings */}
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                      Pesagem e Venda
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Lote</label>
                        <input
                          type="text"
                          maxLength={12}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.lote ?? ""}
                          onChange={(e) => setForm({ ...form, lote: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Unidade de Venda</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.unidadeVenda ?? "PESO"}
                          onChange={(e) =>
                            setForm({ ...form, unidadeVenda: e.target.value as "PESO" | "PECA" })
                          }
                        >
                          <option value="PESO">Peso</option>
                          <option value="PECA">Peça</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Tara (kg)</label>
                        <input
                          type="number"
                          step="0.001"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.tara ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, tara: e.target.value === "" ? undefined : Number(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Desconto (preço promocional)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.desconto ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, desconto: e.target.value === "" ? undefined : Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="taraPorCento"
                          checked={Boolean(form.taraPorCento)}
                          onChange={(e) => setForm({ ...form, taraPorCento: e.target.checked })}
                        />
                        <label htmlFor="taraPorCento" className="text-xs font-medium text-slate-700">
                          Tara por cento (drenado/glaceado)
                        </label>
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="pesoFixo"
                          checked={Boolean(form.pesoFixo)}
                          onChange={(e) => setForm({ ...form, pesoFixo: e.target.checked })}
                        />
                        <label htmlFor="pesoFixo" className="text-xs font-medium text-slate-700">
                          Peso fixo (pré-determinado)
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Modo especial</label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.modoEspecial ?? 0}
                          onChange={(e) => setForm({ ...form, modoEspecial: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Related registrations */}
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                      Vínculos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Sub-Setor</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.subSetorId ?? ""}
                          onChange={(e) => setForm({ ...form, subSetorId: e.target.value })}
                        >
                          <option value="">—</option>
                          {subSetores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.numero} - {s.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Tabela Nutricional</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.tabelaNutricionalId ?? ""}
                          onChange={(e) => setForm({ ...form, tabelaNutricionalId: e.target.value })}
                        >
                          <option value="">—</option>
                          {tabelasNutricionais.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.numero} - {t.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Fornecedor</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.fornecedorId ?? ""}
                          onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}
                        >
                          <option value="">—</option>
                          {fornecedores.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.numero} - {f.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Alérgicos</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.alergicoId ?? ""}
                          onChange={(e) => setForm({ ...form, alergicoId: e.target.value })}
                        >
                          <option value="">—</option>
                          {alergicos.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.numero} - {a.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Imagem</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.imagemId ?? ""}
                          onChange={(e) => setForm({ ...form, imagemId: e.target.value })}
                        >
                          <option value="">—</option>
                          {imagens.map((img) => (
                            <option key={img.id} value={img.id}>
                              {img.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Extra texts */}
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                      Textos Extras
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {([1, 2, 3, 4, 5, 6, 7] as const).map((n) => {
                        const key = `textoExtra${n}` as keyof CreateProductInput;
                        return (
                          <div key={n}>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Texto extra {n}</label>
                            <input
                              type="text"
                              maxLength={250}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                              value={(form[key] as string) ?? ""}
                              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time information */}
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                      Informações de Tempo
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Dias de venda</label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.diasDeVenda ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              diasDeVenda: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Tempo de venda</label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.tempoDeVenda ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              tempoDeVenda: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Validade do pacote</label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.validadePacote ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              validadePacote: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Val. em horas do pacote</label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.validadePacoteHoras ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              validadePacoteHoras: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Validade em dias</label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                          value={form.validadeDias ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              validadeDias: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                        />
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
                  {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Salvar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {isDeleteAllOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center text-red-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-semibold">Excluir todos os produtos</h3>
              </div>
              <button
                onClick={() => {
                  setIsDeleteAllOpen(false);
                  setDeleteAllConfirmText("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Você está prestes a excluir <strong>{products.length} produto(s)</strong> cadastrados
                permanentemente, incluindo o histórico de sincronização deles nas balanças. Essa ação
                não pode ser desfeita.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Digite <span className="font-mono font-semibold">{DELETE_ALL_CONFIRMATION}</span> para
                  confirmar
                </label>
                <input
                  type="text"
                  autoFocus
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                  value={deleteAllConfirmText}
                  onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                  placeholder={DELETE_ALL_CONFIRMATION}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end space-x-3 bg-white">
              <button
                onClick={() => {
                  setIsDeleteAllOpen(false);
                  setDeleteAllConfirmText("");
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deletingAll || deleteAllConfirmText !== DELETE_ALL_CONFIRMATION}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletingAll ? "Excluindo..." : "Excluir Todos"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir produto"
        message={
          <>
            Excluir o produto <strong>{deleteTarget?.nome}</strong>? Essa ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        danger
        loading={deletingOne}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
