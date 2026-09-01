"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Save, X } from "lucide-react";
import type {
  Alergico,
  CreateProductInput,
  FormatoImpressao,
  Fornecedor,
  Imagem,
  SubSetor,
  TabelaNutricional,
} from "../../lib/api";

/**
 * Listas auxiliares que o formulário oferece nos selects. Agrupadas porque são
 * carregadas juntas e sempre viajam juntas — seis props soltas escondiam essa
 * coesão.
 */
export interface CatalogosProduto {
  subSetores: SubSetor[];
  tabelasNutricionais: TabelaNutricional[];
  fornecedores: Fornecedor[];
  alergicos: Alergico[];
  imagens: Imagem[];
  formatosImpressao: FormatoImpressao[];
}

interface ProdutoFormModalProps {
  form: CreateProductInput;
  setForm: Dispatch<SetStateAction<CreateProductInput>>;
  /** O preço vive como texto enquanto está sendo digitado, para não
   * reformatar a cada tecla — ver o `onChange` do campo. */
  precoInput: string;
  setPrecoInput: Dispatch<SetStateAction<string>>;
  custoInput: string;
  setCustoInput: Dispatch<SetStateAction<string>>;
  editingId: string | null;
  saving: boolean;
  error: string;
  catalogos: CatalogosProduto;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

/**
 * Formulário de cadastro/edição de produto (PLU).
 *
 * Extraído de `products/page.tsx` (card #64), onde ocupava 478 das 1.094 linhas.
 * A extração foi feita DEPOIS de existirem testes de comportamento cobrindo o
 * formulário — sem eles, mover 478 linhas de JSX com 29 estados seria aposta.
 */
export function ProdutoFormModal({
  form,
  setForm,
  precoInput,
  setPrecoInput,
  custoInput,
  setCustoInput,
  editingId,
  saving,
  error,
  catalogos,
  onSubmit,
  onClose,
}: ProdutoFormModalProps) {
  return (
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
              onClick={() => onClose()}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="contents">
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informações Básicas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="produto-codigo-do-produto" className="block text-xs font-medium text-slate-700 mb-1">Código do Produto</label>
                    <input
 id="produto-codigo-do-produto"                          type="text"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.codigo}
                      onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="produto-codigo-de-barras-ean-13" className="block text-xs font-medium text-slate-700 mb-1">Código de Barras (EAN-13)</label>
                    <input
 id="produto-codigo-de-barras-ean-13"                          type="text"
                      required
                      maxLength={13}
                      pattern="\d{13}"
                      title="Deve conter exatamente 13 dígitos numéricos (EAN-13)"
                      placeholder="0000000000000"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 font-mono"
                      value={form.codigoBarras}
                      onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="produto-categoria-de-imposto" className="block text-xs font-medium text-slate-700 mb-1">Categoria de Imposto</label>
                    <input
 id="produto-categoria-de-imposto"                          type="text"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.categoriaImposto}
                      onChange={(e) => setForm({ ...form, categoriaImposto: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="produto-modo-de-imposto" className="block text-xs font-medium text-slate-700 mb-1">Modo de Imposto</label>
                    <select
 id="produto-modo-de-imposto"                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.taxType ?? 0}
                      onChange={(e) => setForm({ ...form, taxType: Number(e.target.value) })}
                    >
                      <option value={0}>Sem imposto</option>
                      <option value={1}>Soma por fora do preço</option>
                      <option value={2}>Informativo (não altera o preço)</option>
                      <option value={3}>Embutido no preço</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="produto-aliquota" className="block text-xs font-medium text-slate-700 mb-1">Alíquota (%)</label>
                    <input
 id="produto-aliquota"                          type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      disabled={!form.taxType}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
                      value={form.taxaImposto ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, taxaImposto: e.target.value === "" ? undefined : Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label htmlFor="produto-nome-do-produto" className="block text-xs font-medium text-slate-700 mb-1">Nome do Produto</label>
                    <input
 id="produto-nome-do-produto"                          type="text"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="produto-preco-unitario-r" className="block text-xs font-medium text-slate-700 mb-1">Preço Unitário (R$)</label>
                    <input
 id="produto-preco-unitario-r"                          type="text"
                      inputMode="decimal"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={precoInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        // aceita dígitos e um único separador decimal (, ou .) enquanto o
                        // usuário ainda está digitando, sem forçar re-formatação a cada tecla
                        if (!/^\d*[.,]?\d*$/.test(raw)) return;
                        setPrecoInput(raw);
                        const parsed = Number(raw.replace(",", "."));
                        if (!Number.isNaN(parsed)) setForm({ ...form, preco: parsed });
                      }}
                      onBlur={() => setPrecoInput(String(form.preco).replace(".", ","))}
                    />
                  </div>
                  <div>
                    <label htmlFor="produto-custo-r" className="block text-xs font-medium text-slate-700 mb-1">Custo (R$)</label>
                    <input
 id="produto-custo-r"                          type="text"
                      inputMode="decimal"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={custoInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (!/^\d*[.,]?\d*$/.test(raw)) return;
                        setCustoInput(raw);
                        if (raw === "") {
                          setForm({ ...form, custo: undefined });
                          return;
                        }
                        const parsed = Number(raw.replace(",", "."));
                        if (!Number.isNaN(parsed)) setForm({ ...form, custo: parsed });
                      }}
                      onBlur={() => setCustoInput(form.custo != null ? String(form.custo).replace(".", ",") : "")}
                    />
                  </div>
                  <div>
                    <label htmlFor="produto-ativo" className="block text-xs font-medium text-slate-700 mb-1">Ativo</label>
                    <select
 id="produto-ativo"                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
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
                    <label htmlFor="produto-lote" className="block text-xs font-medium text-slate-700 mb-1">Lote</label>
                    <input
 id="produto-lote"                          type="text"
                      maxLength={12}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.lote ?? ""}
                      onChange={(e) => setForm({ ...form, lote: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="produto-unidade-de-venda" className="block text-xs font-medium text-slate-700 mb-1">Unidade de Venda</label>
                    <select
 id="produto-unidade-de-venda"                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
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
                    <label htmlFor="produto-tara-kg" className="block text-xs font-medium text-slate-700 mb-1">Tara (kg)</label>
                    <input
 id="produto-tara-kg"                          type="number"
                      step="0.001"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.tara ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, tara: e.target.value === "" ? undefined : Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="produto-desconto-preco-promocional" className="block text-xs font-medium text-slate-700 mb-1">Desconto (preço promocional)</label>
                    <input
 id="produto-desconto-preco-promocional"                          type="number"
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
                    <label htmlFor="produto-modo-especial" className="block text-xs font-medium text-slate-700 mb-1">Modo especial</label>
                    <input
 id="produto-modo-especial"                          type="number"
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
                    <label htmlFor="produto-sub-setor" className="block text-xs font-medium text-slate-700 mb-1">Sub-Setor</label>
                    <select
 id="produto-sub-setor"                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.subSetorId ?? ""}
                      onChange={(e) => setForm({ ...form, subSetorId: e.target.value })}
                    >
                      <option value="">—</option>
                      {catalogos.subSetores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.numero} - {s.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="produto-tabela-nutricional" className="block text-xs font-medium text-slate-700 mb-1">Tabela Nutricional</label>
                    <select
 id="produto-tabela-nutricional"                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.tabelaNutricionalId ?? ""}
                      onChange={(e) => setForm({ ...form, tabelaNutricionalId: e.target.value })}
                    >
                      <option value="">—</option>
                      {catalogos.tabelasNutricionais.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.numero} - {t.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="produto-fornecedor" className="block text-xs font-medium text-slate-700 mb-1">Fornecedor</label>
                    <select
 id="produto-fornecedor"                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.fornecedorId ?? ""}
                      onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}
                    >
                      <option value="">—</option>
                      {catalogos.fornecedores.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.numero} - {f.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="produto-catalogos.alergicos" className="block text-xs font-medium text-slate-700 mb-1">Alérgicos</label>
                    <select
 id="produto-catalogos.alergicos"                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.alergicoId ?? ""}
                      onChange={(e) => setForm({ ...form, alergicoId: e.target.value })}
                    >
                      <option value="">—</option>
                      {catalogos.alergicos.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.numero} - {a.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="produto-imagem" className="block text-xs font-medium text-slate-700 mb-1">Imagem</label>
                    <select
 id="produto-imagem"                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.imagemId ?? ""}
                      onChange={(e) => setForm({ ...form, imagemId: e.target.value })}
                    >
                      <option value="">—</option>
                      {catalogos.imagens.map((img) => (
                        <option key={img.id} value={img.id}>
                          {img.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="produto-formato-de-impressao" className="block text-xs font-medium text-slate-700 mb-1">Formato de Impressão</label>
                    <select
 id="produto-formato-de-impressao"                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                      value={form.formatoImpressaoId ?? ""}
                      onChange={(e) => setForm({ ...form, formatoImpressaoId: e.target.value })}
                    >
                      <option value="">—</option>
                      {catalogos.formatosImpressao.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.numero} - {f.nome}
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
                    <label htmlFor="produto-dias-de-venda" className="block text-xs font-medium text-slate-700 mb-1">Dias de venda</label>
                    <input
 id="produto-dias-de-venda"                          type="number"
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
                    <label htmlFor="produto-tempo-de-venda" className="block text-xs font-medium text-slate-700 mb-1">Tempo de venda</label>
                    <input
 id="produto-tempo-de-venda"                          type="number"
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
                    <label htmlFor="produto-validade-do-pacote" className="block text-xs font-medium text-slate-700 mb-1">Validade do pacote</label>
                    <input
 id="produto-validade-do-pacote"                          type="number"
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
                    <label htmlFor="produto-val-em-horas-do-pacote" className="block text-xs font-medium text-slate-700 mb-1">Val. em horas do pacote</label>
                    <input
 id="produto-val-em-horas-do-pacote"                          type="number"
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
                    <label htmlFor="produto-validade-em-dias" className="block text-xs font-medium text-slate-700 mb-1">Validade em dias</label>
                    <input
 id="produto-validade-em-dias"                          type="number"
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
              onClick={() => onClose()}
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
  );
}
