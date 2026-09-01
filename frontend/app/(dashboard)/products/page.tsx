"use client";

import { useRef, useState, useEffect } from "react";
import { Plus, Search, Filter, Download, Upload, Pencil, Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import {
  productsApi,
  PRODUCTS_MAX_PAGE_SIZE,
  getCurrentUser,
  subSetoresApi,
  tabelasNutricionaisApi,
  fornecedoresApi,
  alergicosApi,
  imagensApi,
  formatosImpressaoApi,
  type Product,
  type CreateProductInput,
  type SubSetor,
  type TabelaNutricional,
  type Fornecedor,
  type Alergico,
  type Imagem,
  type FormatoImpressao,
  ApiError,
} from "../../../lib/api";
import { parseCsv, toCsv } from "../../../lib/produtos-csv";
import { ProdutoFormModal } from "../../../components/products/ProdutoFormModal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

const emptyForm: CreateProductInput = {
  codigo: "",
  codigoBarras: "",
  nome: "",
  preco: 0,
  categoriaImposto: "",
  taxType: 0,
  taxaImposto: undefined,
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
  formatoImpressaoId: "",
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductInput>(emptyForm);
  const [precoInput, setPrecoInput] = useState("");
  const [custoInput, setCustoInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  /** Linhas por página na tabela de produtos. */
const PAGE_SIZE = 50;

const DELETE_ALL_CONFIRMATION = "EXCLUIR TODOS";
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deletingOne, setDeletingOne] = useState(false);
  const [subSetores, setSubSetores] = useState<SubSetor[]>([]);
  const [tabelasNutricionais, setTabelasNutricionais] = useState<TabelaNutricional[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [alergicos, setAlergicos] = useState<Alergico[]>([]);
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [formatosImpressao, setFormatosImpressao] = useState<FormatoImpressao[]>([]);
  /** Listas auxiliares cuja leitura falhou — vazio aqui não significa "não há". */
  const [listasComFalha, setListasComFalha] = useState<string[]>([]);

  /**
   * Listas auxiliares que alimentam os selects do formulário.
   *
   * Antes, cada falha virava `setX([])` em silêncio: o dropdown ficava vazio e
   * a pessoa concluía "não há fornecedores cadastrados", cadastrando produto
   * sem vínculo — e são esses vínculos que a etiqueta imprime. Ausência de dado
   * não é dado (card #67); quando a leitura falha, a tela avisa.
   */
  useEffect(() => {
    const carregar = <T,>(
      nome: string,
      buscar: () => Promise<T[]>,
      guardar: (v: T[]) => void,
    ) => buscar().then(guardar).catch(() => nome);

    void Promise.all([
      carregar("Sub-Setores", subSetoresApi.list, setSubSetores),
      carregar("Tabelas Nutricionais", tabelasNutricionaisApi.list, setTabelasNutricionais),
      carregar("Fornecedores", fornecedoresApi.list, setFornecedores),
      carregar("Alérgicos", alergicosApi.list, setAlergicos),
      carregar("Imagens", imagensApi.list, setImagens),
      carregar("Formatos de Impressão", formatosImpressaoApi.list, setFormatosImpressao),
    ]).then((resultados) => {
      const falharam = resultados.filter((r): r is string => typeof r === "string");
      if (falharam.length > 0) setListasComFalha(falharam);
    });
  }, []);

  /** Busca e filtro de status vão para o banco — a página nunca carrega o
   *  catálogo inteiro só para filtrar na memória do navegador. */
  const listParams = (targetPage: number) => ({
    page: targetPage,
    pageSize: PAGE_SIZE,
    search: searchTerm,
    ativo: statusFilter === "ativos" ? true : statusFilter === "inativos" ? false : undefined,
  });

  const loadProducts = async (targetPage = page) => {
    setLoading(true);
    setError("");
    if (!getCurrentUser()?.clienteId) {
      setError("Nenhuma empresa selecionada. Escolha uma empresa cadastrada para ver os produtos.");
      setLoading(false);
      return;
    }
    try {
      const resultado = await productsApi.list(listParams(targetPage));
      setProducts(resultado.data);
      setTotal(resultado.total);
      setPage(resultado.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  };

  // Digitar na busca não pode disparar uma requisição por tecla; o atraso
  // curto agrupa a digitação numa consulta só. Qualquer mudança de busca ou
  // filtro volta para a primeira página — a página 7 do resultado anterior
  // provavelmente nem existe no novo.
  useEffect(() => {
    const timer = setTimeout(() => loadProducts(1), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const temFiltroAtivo = searchTerm.trim().length > 0 || statusFilter !== "todos";
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const primeiroDaPagina = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const ultimoDaPagina = Math.min(page * PAGE_SIZE, total);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPrecoInput("");
    setCustoInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setForm({
      codigo: product.codigo,
      codigoBarras: product.codigoBarras,
      nome: product.nome,
      preco: product.preco,
      custo: product.custo ?? undefined,
      categoriaImposto: product.categoriaImposto ?? "",
      taxType: product.taxType ?? 0,
      taxaImposto: product.taxaImposto ?? undefined,
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
      formatoImpressaoId: product.formatoImpressaoId ?? "",
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
    setPrecoInput(String(product.preco).replace(".", ","));
    setCustoInput(product.custo != null ? String(product.custo).replace(".", ",") : "");
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

  // O CSV exporta tudo que casa com o filtro atual, não só a página na tela —
  // por isso percorre as páginas em vez de usar `products`.
  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const todos: Product[] = [];
      let paginaAtual = 1;
      let paginas = 1;
      do {
        const resultado = await productsApi.list({ ...listParams(paginaAtual), pageSize: PRODUCTS_MAX_PAGE_SIZE });
        todos.push(...resultado.data);
        paginas = Math.max(1, Math.ceil(resultado.total / PRODUCTS_MAX_PAGE_SIZE));
        paginaAtual += 1;
      } while (paginaAtual <= paginas);
      baixarCsv(todos);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível exportar os produtos.");
    } finally {
      setExporting(false);
    }
  };

  const baixarCsv = (lista: Product[]) => {
    const csv = toCsv(lista);
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
            disabled={total === 0 || exporting}
            className="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
          >
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? "Exportando..." : "Exportar"}
          </button>
          <button
            onClick={() => setIsDeleteAllOpen(true)}
            disabled={total === 0 && !temFiltroAtivo}
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

      {/* Aviso separado do `error` de propósito: não é falha da ação que a pessoa
          acabou de fazer, é uma lista que não carregou. Sem isso, o select vazio
          seria indistinguível de "não há nada cadastrado" (card #67). */}
      {listasComFalha.length > 0 && (
        <div className="p-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg">
          Não foi possível carregar: <strong>{listasComFalha.join(", ")}</strong>. Os campos
          correspondentes aparecem vazios por falha de leitura, não por estarem sem cadastro —
          recarregue a página antes de salvar.
        </div>
      )}
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
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    {temFiltroAtivo
                      ? "Nenhum produto encontrado para os filtros aplicados."
                      : "Nenhum produto cadastrado."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            {total === 0
              ? "Nenhum produto"
              : `Mostrando ${primeiroDaPagina}–${ultimoDaPagina} de ${total} produto(s)`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadProducts(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Anterior
            </button>
            <span className="tabular-nums">
              Página {page} de {totalPaginas}
            </span>
            <button
              onClick={() => loadProducts(page + 1)}
              disabled={page >= totalPaginas || loading}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* PLU Form Modal */}
      {isModalOpen && (
        <ProdutoFormModal
          form={form}
          setForm={setForm}
          precoInput={precoInput}
          setPrecoInput={setPrecoInput}
          custoInput={custoInput}
          setCustoInput={setCustoInput}
          editingId={editingId}
          saving={saving}
          error={error}
          catalogos={{ subSetores, tabelasNutricionais, fornecedores, alergicos, imagens, formatosImpressao }}
          onSubmit={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
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
                Você está prestes a excluir <strong>todos os produtos desta loja</strong>
                permanentemente{temFiltroAtivo ? " — inclusive os que os filtros atuais escondem" : ""},
                incluindo o histórico de sincronização deles nas balanças. Essa ação não pode ser
                desfeita.
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
