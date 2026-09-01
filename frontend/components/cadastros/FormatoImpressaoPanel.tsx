"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Pencil, Plus, Trash2, LayoutTemplate, Tag, X } from "lucide-react";
import {
  formatosImpressaoApi,
  devicesApi,
  productsApi,
  imagensApi,
  tabelasNutricionaisApi,
  ApiError,
  type FormatoImpressao,
  type Product,
  type Imagem,
  type TabelaNutricional,
  type SlotsEtiquetaResponse,
} from "../../lib/api";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EtiquetaPreview } from "../products/EtiquetaPreview";

type ElementoTipo =
  | "nome"
  | "preco"
  | "precoUnitario"
  | "peso"
  | "tara"
  | "validade"
  | "dataEmbalagem"
  | "pesoBrutoLiquido"
  | "lote"
  | "textoExtra5"
  | "textoExtra7"
  | "codigoBarras"
  | "texto"
  | "imagem"
  | "tabelaNutricional"
  | "selos"
  | "ingredientes"
  // Linhas e molduras. Vieram para permitir importar os modelos de fábrica da
  // Ramuza (card #52), onde 181 elementos são exatamente isso — sem eles todo
  // layout importado abre com os campos soltos no branco.
  | "borda"
  | "divisoria";

interface LayoutElemento {
  id: string;
  tipo: ElementoTipo;
  x: number; // mm
  y: number; // mm
  largura: number; // mm
  altura: number; // mm
  texto?: string;
  /** Rotação do elemento na impressão: 0/90/180/270 graus. Mapeado pro `Angle`
   * do wire (`LabelItem` da balança) como índice de giro de 90° (0/1/2/3) —
   * convenção assumida, ainda sem confirmação visual na etiqueta impressa
   * (só write→readback confirmado). */
  angulo?: 0 | 90 | 180 | 270;
  /** Alinhamento do texto dentro do elemento. Mapeado pro `Align` do wire
   * como 0=esquerda/1=centro/2=direita — mesma ressalva do ângulo. */
  alinhamento?: 0 | 1 | 2;
  /** Tamanho/índice de fonte. Mapeado pro `Font` do wire — sem tabela de
   * valores confirmada ainda, aceita qualquer inteiro >= 0 (0 = padrão da
   * balança). */
  fonte?: number;
  /** Espessura da linha, só para `borda`/`divisoria`. Em Borda o wire usa o
   * próprio Flag2 como espessura (1..15, documentado no LabelItem.xml
   * oficial); os modelos de fábrica usam quase só 2 e 15. */
  espessura?: number;
}

const ALINHAMENTO_LABEL: Record<0 | 1 | 2, string> = { 0: "Esquerda", 1: "Centro", 2: "Direita" };
const ALINHAMENTO_CSS: Record<0 | 1 | 2, string> = { 0: "flex-start", 1: "center", 2: "flex-end" };

const TIPO_LABEL: Record<ElementoTipo, string> = {
  nome: "Nome do Produto",
  preco: "Preço Total",
  precoUnitario: "Preço por kg/un",
  peso: "Peso",
  tara: "Tara",
  validade: "Validade",
  dataEmbalagem: "Data de Embalagem",
  pesoBrutoLiquido: "Indicador B/L (bruto/líquido)",
  lote: "Lote",
  textoExtra5: "Texto Extra 5",
  textoExtra7: "Texto Extra 7",
  codigoBarras: "Código de Barras",
  texto: "Texto Livre",
  imagem: "Imagem/Logo",
  tabelaNutricional: "Tabela Nutricional",
  selos: "Selos (Alto em...)",
  ingredientes: "Ingredientes",
  borda: "Borda / Moldura",
  divisoria: "Linha divisória",
};

const TIPO_DEFAULT_SIZE: Record<ElementoTipo, { largura: number; altura: number }> = {
  nome: { largura: 40, altura: 8 },
  preco: { largura: 30, altura: 12 },
  precoUnitario: { largura: 25, altura: 6 },
  peso: { largura: 20, altura: 6 },
  tara: { largura: 20, altura: 6 },
  validade: { largura: 25, altura: 6 },
  dataEmbalagem: { largura: 25, altura: 6 },
  pesoBrutoLiquido: { largura: 6, altura: 5 },
  lote: { largura: 25, altura: 5 },
  textoExtra5: { largura: 40, altura: 5 },
  textoExtra7: { largura: 40, altura: 5 },
  codigoBarras: { largura: 45, altura: 15 },
  texto: { largura: 30, altura: 6 },
  imagem: { largura: 20, altura: 20 },
  tabelaNutricional: { largura: 50, altura: 40 },
  selos: { largura: 50, altura: 10 },
  ingredientes: { largura: 50, altura: 16 },
  borda: { largura: 50, altura: 10 },
  divisoria: { largura: 50, altura: 0.5 },
};

const PX_PER_MM = 4;

function getElementos(layout: Record<string, unknown> | null | undefined): LayoutElemento[] {
  const el = (layout as { elementos?: LayoutElemento[] } | undefined)?.elementos;
  return el ?? [];
}

export function FormatoImpressaoPanel() {
  const [formatos, setFormatos] = useState<FormatoImpressao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Salvar dispara a sincronização no backend; sem dizer isso na tela a pessoa
  // não tem como saber se a balança recebeu o layout novo.
  const [aviso, setAviso] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FormatoImpressao | null>(null);
  const [numero, setNumero] = useState(0);
  const [nome, setNome] = useState("");
  const [larguraMm, setLarguraMm] = useState(56);
  const [alturaMm, setAlturaMm] = useState(90);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormatoImpressao | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Visual layout editor
  const [layoutEditing, setLayoutEditing] = useState<FormatoImpressao | null>(null);
  const [elementos, setElementos] = useState<LayoutElemento[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingLayout, setSavingLayout] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; offsetXMm: number; offsetYMm: number } | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [tabelasNutricionais, setTabelasNutricionais] = useState<TabelaNutricional[]>([]);
  const [previewFormato, setPreviewFormato] = useState<FormatoImpressao | null>(null);

  // Mapa de slots lidos das balanças da loja (card #55). Sem ele o usuário
  // escolhe o número no escuro: cair num slot ocupado por modelo de fábrica faz
  // a balança aceitar e descartar em silêncio, e a etiqueta sai com o layout
  // errado sem nenhum aviso.
  const [slots, setSlots] = useState<SlotsEtiquetaResponse | null>(null);

  const load = () => {
    setLoading(true);
    formatosImpressaoApi
      .list()
      .then(setFormatos)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar formatos."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    productsApi.listForPicker().then(setProducts).catch(() => setProducts([]));
    imagensApi.list().then(setImagens).catch(() => setImagens([]));
    tabelasNutricionaisApi.list().then(setTabelasNutricionais).catch(() => setTabelasNutricionais([]));
    // Falha aqui não bloqueia o cadastro: sem o mapa a tela volta a ser o que
    // era, só não consegue avisar sobre slot ocupado.
    devicesApi.slotsEtiqueta().then(setSlots).catch(() => setSlots(null));
  }, []);

  const openCreate = () => {
    setEditing(null);
    // Sugere o primeiro número que as balanças da loja reportaram como livre.
    // Sem mapa, mantém o 0 de antes em vez de chutar um número.
    setNumero(slots?.livres[0] ?? 0);
    setNome("");
    setLarguraMm(56);
    setAlturaMm(90);
    setModalOpen(true);
  };

  const openEdit = (f: FormatoImpressao) => {
    setEditing(f);
    setNumero(f.numero);
    setNome(f.nome);
    setLarguraMm(f.larguraMm);
    setAlturaMm(f.alturaMm);
    setModalOpen(true);
  };


  /**
   * O slot escolhido já está ocupado em alguma balança da loja?
   *
   * Editar o próprio formato não conta como conflito — ele ocupa o slot dele
   * mesmo. Sem mapa lido, devolve null: a tela não afirma nada, porque não
   * saber é diferente de estar livre.
   */
  const conflitoDeSlot = (() => {
    if (!slots) return null;
    const ocupado = slots.slots.find((s) => s.numero === numero);
    if (!ocupado) return null;
    if (editing && editing.numero === numero && ocupado.nome === editing.nome) return null;
    return ocupado;
  })();

  const descreverSync = (sinc?: { balancas: number; produtos: number }) => {
    if (!sinc || sinc.balancas === 0) {
      return "Layout salvo. Nenhuma balança com Agent Local vinculado nesta loja — nada foi enviado.";
    }
    const b = sinc.balancas === 1 ? "1 balança" : `${sinc.balancas} balanças`;
    return `Layout salvo e enviado para ${b}. Acompanhe em Sincronização.`;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setAviso(null);
    try {
      const payload = { numero, nome, tipo: 1, larguraMm, alturaMm };
      const salvo = editing
        ? await formatosImpressaoApi.update(editing.id, payload)
        : await formatosImpressaoApi.create({ ...payload, layout: {} });
      setAviso(descreverSync(salvo.sincronizacao));
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar formato de impressão.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await formatosImpressaoApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir formato de impressão.");
    } finally {
      setDeleting(false);
    }
  };

  const openLayout = (f: FormatoImpressao) => {
    setLayoutEditing(f);
    setElementos(getElementos(f.layout));
    setSelectedId(null);
  };

  const closeLayout = () => {
    setLayoutEditing(null);
    setElementos([]);
    setSelectedId(null);
  };

  const addElemento = (tipo: ElementoTipo) => {
    if (!layoutEditing) return;
    const size = TIPO_DEFAULT_SIZE[tipo];
    const id = `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setElementos((prev) => {
      // Escalona a posição default em cascata (passo de 6mm) pra cliques rápidos em
      // "adicionar elemento" não empilharem tudo nas mesmas coordenadas — eles ficariam
      // visualmente sobrepostos como se fosse um único elemento, mas são N entradas
      // distintas salvas no layout (risco de conteúdo duplicado na etiqueta impressa).
      const step = 6;
      const maxY = Math.max(0, layoutEditing.alturaMm - size.altura);
      const offset = maxY > 0 ? (prev.length * step) % (maxY + step) : 0;
      const novo: LayoutElemento = {
        id,
        tipo,
        x: Math.max(0, (layoutEditing.larguraMm - size.largura) / 2),
        y: Math.min(4 + offset, maxY),
        largura: Math.min(size.largura, layoutEditing.larguraMm),
        altura: size.altura,
        texto: tipo === "texto" ? "Texto" : undefined,
      };
      return [...prev, novo];
    });
    setSelectedId(id);
  };

  const removeElemento = (id: string) => {
    setElementos((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateElemento = (id: string, patch: Partial<LayoutElemento>) => {
    setElementos((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const handlePointerDown = (e: React.PointerEvent, el: LayoutElemento) => {
    e.stopPropagation();
    setSelectedId(el.id);
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const pointerXMm = (e.clientX - canvasRect.left) / PX_PER_MM;
    const pointerYMm = (e.clientY - canvasRect.top) / PX_PER_MM;
    dragState.current = { id: el.id, offsetXMm: pointerXMm - el.x, offsetYMm: pointerYMm - el.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !layoutEditing || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const pointerXMm = (e.clientX - canvasRect.left) / PX_PER_MM;
    const pointerYMm = (e.clientY - canvasRect.top) / PX_PER_MM;
    const el = elementos.find((el) => el.id === dragState.current!.id);
    if (!el) return;
    const newX = Math.min(
      Math.max(0, pointerXMm - dragState.current.offsetXMm),
      layoutEditing.larguraMm - el.largura,
    );
    const newY = Math.min(
      Math.max(0, pointerYMm - dragState.current.offsetYMm),
      layoutEditing.alturaMm - el.altura,
    );
    updateElemento(dragState.current.id, { x: newX, y: newY });
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  const handleSaveLayout = async () => {
    if (!layoutEditing) return;
    setSavingLayout(true);
    setError(null);
    setAviso(null);
    try {
      const salvo = await formatosImpressaoApi.update(layoutEditing.id, { layout: { elementos } });
      setAviso(descreverSync(salvo.sincronizacao));
      closeLayout();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar o layout.");
    } finally {
      setSavingLayout(false);
    }
  };

  const selected = elementos.find((e) => e.id === selectedId) ?? null;
  const canvasSize = layoutEditing
    ? { width: layoutEditing.larguraMm * PX_PER_MM, height: layoutEditing.alturaMm * PX_PER_MM }
    : { width: 0, height: 0 };

  const elementosCount = useMemo(() => (f: FormatoImpressao) => getElementos(f.layout).length, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Formato de Impressão</h2>
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

      {aviso && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm flex items-start justify-between gap-3">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} className="text-blue-500 hover:text-blue-700 shrink-0">
            Fechar
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Número</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Dimensões</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Elementos</th>
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
            ) : formatos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nenhum formato de etiqueta cadastrado.
                </td>
              </tr>
            ) : (
              formatos.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">{f.numero}</td>
                  <td className="px-4 py-3">{f.nome}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {f.larguraMm}mm x {f.alturaMm}mm
                  </td>
                  <td className="px-4 py-3">{elementosCount(f)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setPreviewFormato(f)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Pré-visualizar etiqueta"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openLayout(f)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Editar layout visual"
                      >
                        <LayoutTemplate className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(f)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Editar número/nome/dimensões"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(f)}
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

      {/* Basic form modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editing ? "Editar Formato de Impressão" : "Novo Formato de Impressão"}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="formato-numero" className="block text-sm font-medium text-slate-700 mb-1">Número *</label>
                <input
                  type="number"
                  id="formato-numero"
                  value={numero}
                  onChange={(e) => setNumero(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    conflitoDeSlot
                      ? "border-amber-400 focus:ring-amber-500"
                      : "border-slate-200 focus:ring-brand-500"
                  }`}
                />
                {conflitoDeSlot ? (
                  <p className="mt-1 text-xs text-amber-700">
                    O número {conflitoDeSlot.numero} já está ocupado em{" "}
                    <strong>{conflitoDeSlot.deviceNome}</strong> por &quot;{conflitoDeSlot.nome}&quot;. Se for um
                    modelo de fábrica, a balança aceita o envio e descarta em silêncio — a etiqueta sai com o
                    layout errado.
                    {slots && slots.livres.length > 0 ? (
                      <>
                        {" "}
                        <button
                          type="button"
                          onClick={() => setNumero(slots.livres[0])}
                          className="underline font-medium"
                        >
                          Usar {slots.livres[0]}, que está livre
                        </button>
                        .
                      </>
                    ) : null}
                  </p>
                ) : slots == null ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Não foi possível ler os números já usados nas balanças desta loja — confira o número antes de
                    salvar.
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="formato-nome" className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  id="formato-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="formato-largura" className="block text-sm font-medium text-slate-700 mb-1">Largura (mm) *</label>
                  <input
                    type="number"
                    id="formato-largura"
                  value={larguraMm}
                    onChange={(e) => setLarguraMm(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="formato-altura" className="block text-sm font-medium text-slate-700 mb-1">Altura (mm) *</label>
                  <input
                    type="number"
                    id="formato-altura"
                  value={alturaMm}
                    onChange={(e) => setAlturaMm(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
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

      {/* Visual layout editor */}
      {layoutEditing && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Layout — {layoutEditing.nome} ({layoutEditing.larguraMm}mm x {layoutEditing.alturaMm}mm)
              </h3>
              <button onClick={closeLayout} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.keys(TIPO_LABEL) as ElementoTipo[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => addElemento(tipo)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium"
                >
                  <Plus className="w-3 h-3" /> {TIPO_LABEL[tipo]}
                </button>
              ))}
            </div>

            <div className="flex gap-6">
              <div
                ref={canvasRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedId(null);
                }}
                className="relative bg-white border-2 border-slate-300 rounded shrink-0"
                style={{ width: canvasSize.width, height: canvasSize.height }}
              >
                {elementos.map((el) => {
                  // Borda e divisória são o traço em si, não uma caixa com
                  // rótulo dentro: desenhar o nome do tipo dentro delas
                  // deixaria a etiqueta ilegível, já que num layout de fábrica
                  // elas são dezenas.
                  const eTraco = el.tipo === "borda" || el.tipo === "divisoria";
                  const selecionado = selectedId === el.id;
                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) => handlePointerDown(e, el)}
                      className={`absolute flex items-center text-center text-[9px] leading-tight cursor-move select-none ${
                        eTraco
                          ? selecionado
                            ? "border-2 border-brand-500 bg-brand-100/40"
                            : "border border-slate-400 bg-slate-400/20"
                          : selecionado
                            ? "border border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-300"
                            : "border border-slate-300 bg-slate-50 text-slate-500"
                      }`}
                      style={{
                        left: el.x * PX_PER_MM,
                        top: el.y * PX_PER_MM,
                        width: el.largura * PX_PER_MM,
                        // Uma linha de 0,5mm sumiria na tela; garante 1px.
                        height: Math.max(el.altura * PX_PER_MM, eTraco ? 1 : 0),
                        justifyContent: ALINHAMENTO_CSS[el.alinhamento ?? 0],
                        transform: el.angulo ? `rotate(${el.angulo}deg)` : undefined,
                      }}
                      title={eTraco ? TIPO_LABEL[el.tipo] : undefined}
                    >
                      {eTraco ? null : el.tipo === "texto" ? el.texto : TIPO_LABEL[el.tipo]}
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 min-w-[220px]">
                {selected ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-700">{TIPO_LABEL[selected.tipo]}</p>
                    {selected.tipo === "texto" && (
                      <div>
                        <label htmlFor="formato-texto" className="block text-xs font-medium text-slate-500 mb-1">Texto</label>
                        <input id="formato-texto"
                          type="text"
                          value={selected.texto ?? ""}
                          onChange={(e) => updateElemento(selected.id, { texto: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="formato-x-mm" className="block text-xs font-medium text-slate-500 mb-1">X (mm)</label>
                        <input id="formato-x-mm"
                          type="number"
                          value={Math.round(selected.x)}
                          onChange={(e) => updateElemento(selected.id, { x: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="formato-y-mm" className="block text-xs font-medium text-slate-500 mb-1">Y (mm)</label>
                        <input id="formato-y-mm"
                          type="number"
                          value={Math.round(selected.y)}
                          onChange={(e) => updateElemento(selected.id, { y: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="formato-largura-mm" className="block text-xs font-medium text-slate-500 mb-1">Largura (mm)</label>
                        <input id="formato-largura-mm"
                          type="number"
                          value={Math.round(selected.largura)}
                          onChange={(e) => updateElemento(selected.id, { largura: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="formato-altura-mm" className="block text-xs font-medium text-slate-500 mb-1">Altura (mm)</label>
                        <input id="formato-altura-mm"
                          type="number"
                          value={Math.round(selected.altura)}
                          onChange={(e) => updateElemento(selected.id, { altura: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="formato-rotacao" className="block text-xs font-medium text-slate-500 mb-1">Rotação</label>
                        <select id="formato-rotacao"
                          value={selected.angulo ?? 0}
                          onChange={(e) =>
                            updateElemento(selected.id, { angulo: Number(e.target.value) as 0 | 90 | 180 | 270 })
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        >
                          <option value={0}>0°</option>
                          <option value={90}>90°</option>
                          <option value={180}>180°</option>
                          <option value={270}>270°</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="formato-alinhamento" className="block text-xs font-medium text-slate-500 mb-1">Alinhamento</label>
                        <select id="formato-alinhamento"
                          value={selected.alinhamento ?? 0}
                          onChange={(e) => updateElemento(selected.id, { alinhamento: Number(e.target.value) as 0 | 1 | 2 })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                        >
                          {([0, 1, 2] as const).map((a) => (
                            <option key={a} value={a}>
                              {ALINHAMENTO_LABEL[a]}
                            </option>
                          ))}
                        </select>
                      </div>
                      {selected.tipo === "borda" ? (
                        <div className="col-span-2">
                          <label htmlFor="formato-espessura" className="block text-xs font-medium text-slate-500 mb-1">Espessura</label>
                          <input id="formato-espessura"
                            type="number"
                            min={1}
                            max={15}
                            value={selected.espessura ?? 2}
                            onChange={(e) => updateElemento(selected.id, { espessura: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                          />
                          <p className="mt-1 text-xs text-slate-400">De 1 a 15. Os modelos da Ramuza usam 2 ou 15.</p>
                        </div>
                      ) : (
                        <div className="col-span-2">
                          <label htmlFor="formato-fonte-tamanho" className="block text-xs font-medium text-slate-500 mb-1">Fonte (tamanho)</label>
                          <input id="formato-fonte-tamanho"
                            type="number"
                            min={0}
                            value={selected.fonte ?? 0}
                            onChange={(e) => updateElemento(selected.id, { fonte: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeElemento(selected.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" /> Remover elemento
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Clique num botão acima para adicionar um elemento, ou clique num elemento na etiqueta para
                    editá-lo. Arraste os elementos para reposicionar.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeLayout}
                disabled={savingLayout}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLayout}
                disabled={savingLayout}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
              >
                {savingLayout ? "Salvando..." : "Salvar Layout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFormato && (
        <EtiquetaPreview
          products={products}
          formatos={formatos}
          imagens={imagens}
          tabelasNutricionais={tabelasNutricionais}
          initialFormatoId={previewFormato.id}
          onClose={() => setPreviewFormato(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Formato de Impressão"
        message="Tem certeza que deseja excluir este formato de impressão? Essa ação não pode ser desfeita."
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
