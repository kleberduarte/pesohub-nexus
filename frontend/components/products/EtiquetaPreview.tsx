"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { X, Search } from "lucide-react";
import type { Product, FormatoImpressao, Imagem, TabelaNutricional } from "../../lib/api";
import { NUTRIENTES_PADRAO } from "../../lib/nutrientes-padrao";

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
}

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

/** Peso/tara não existem no cadastro (vêm da pesagem na balança) — o preview
 * mostra um valor ilustrativo só pra dar noção de espaço ocupado. */
const PESO_EXEMPLO = "0,190 kg";
const TARA_EXEMPLO = "0,000 kg";

const UNIDADE_LABEL: Record<string, string> = {
  KCAL_KJ: "kcal",
  G: "g",
  MG: "mg",
  MCG: "mcg",
};

// A tabela fixa dos 10 nutrientes padrão vive em ../../lib/nutrientes-padrao
// (compartilhada com o formulário de cadastro) — ver o comentário lá pra por
// que a posição (`ordem`) e não o nome é o que importa pro wire da balança.

const PX_PER_MM = 5;

function getElementos(layout: Record<string, unknown> | null | undefined): LayoutElemento[] {
  const el = (layout as { elementos?: LayoutElemento[] } | undefined)?.elementos;
  return el ?? [];
}

function formatPrecoValor(preco: number): string {
  return preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** A balança calcula a validade na hora da pesagem (hoje + `validadeDias`);
 * aqui é só a projeção pro preview, no mesmo formato dd-mm-aa que ela imprime. */
function formatDataMaisDias(dias: number | null | undefined): string {
  const d = new Date();
  d.setDate(d.getDate() + (dias ?? 0));
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const aa = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${aa}`;
}

interface EtiquetaPreviewProps {
  products: Product[];
  formatos: FormatoImpressao[];
  imagens?: Imagem[];
  tabelasNutricionais?: TabelaNutricional[];
  initialProductId?: string;
  initialFormatoId?: string;
  onClose: () => void;
}

export function EtiquetaPreview({
  products,
  formatos,
  imagens = [],
  tabelasNutricionais = [],
  initialProductId,
  initialFormatoId,
  onClose,
}: EtiquetaPreviewProps) {
  const [productId, setProductId] = useState(initialProductId ?? products[0]?.id ?? "");
  const product = products.find((p) => p.id === productId) ?? null;

  const [formatoId, setFormatoId] = useState(
    initialFormatoId ??
      (product?.formatoImpressaoId && formatos.some((f) => f.id === product.formatoImpressaoId)
        ? product.formatoImpressaoId
        : (formatos[0]?.id ?? "")),
  );
  const barcodeRefs = useRef(new Map<string, SVGSVGElement>());

  const formato = formatos.find((f) => f.id === formatoId) ?? null;
  const elementos = getElementos(formato?.layout);
  const imagem = imagens.find((img) => img.id === product?.imagemId);
  const tabelaNutricional = tabelasNutricionais.find((t) => t.id === product?.tabelaNutricionalId);

  useEffect(() => {
    if (!product) return;
    elementos
      .filter((el) => el.tipo === "codigoBarras")
      .forEach((el) => {
        const svg = barcodeRefs.current.get(el.id);
        if (!svg) return;
        try {
          JsBarcode(svg, product.codigoBarras, {
            format: "EAN13",
            displayValue: true,
            fontSize: 12,
            height: Math.max(20, el.altura * PX_PER_MM * 0.55),
            margin: 0,
          });
        } catch {
          svg.innerHTML = "";
        }
      });
  }, [elementos, product]);

  const canvasSize = formato
    ? { width: formato.larguraMm * PX_PER_MM, height: formato.alturaMm * PX_PER_MM }
    : { width: 0, height: 0 };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Pré-visualização da Etiqueta</h3>
            {product && <p className="text-sm text-slate-500">{product.nome}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            Nenhum produto cadastrado. Cadastre um produto em Produtos (PLU) para pré-visualizar a etiqueta.
          </p>
        ) : formatos.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            Nenhum formato de impressão cadastrado. Crie um em Etiquetas → Formato de Impressão.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {products.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Produto</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} - {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Formato de Impressão</label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                  value={formatoId}
                  onChange={(e) => setFormatoId(e.target.value)}
                >
                  {formatos.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.numero} - {f.nome} ({f.larguraMm}mm x {f.alturaMm}mm)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formato && elementos.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">
                Este formato ainda não tem elementos no layout. Edite o layout visual em Etiquetas.
              </p>
            )}

            {formato && product && elementos.length > 0 && (
              <div className="flex justify-center py-4 bg-slate-50 rounded-lg">
                <div
                  className="relative bg-white border-2 border-slate-300 rounded shadow-sm shrink-0"
                  style={{ width: canvasSize.width, height: canvasSize.height }}
                >
                  {elementos.map((el) => (
                    <div
                      key={el.id}
                      className={`absolute flex items-center justify-center overflow-hidden text-center leading-tight ${
                        // Borda desenha a moldura; divisória é o próprio
                        // traço. Sem isso a pré-visualização mostraria a
                        // etiqueta sem nenhuma das linhas que a balança imprime.
                        el.tipo === "borda"
                          ? "border border-slate-900"
                          : el.tipo === "divisoria"
                            ? "bg-slate-900"
                            : ""
                      }`}
                      style={{
                        left: el.x * PX_PER_MM,
                        top: el.y * PX_PER_MM,
                        width: el.largura * PX_PER_MM,
                        // Um traço de 0,5mm arredondaria para 0 e sumiria.
                        height: Math.max(
                          el.altura * PX_PER_MM,
                          el.tipo === "borda" || el.tipo === "divisoria" ? 1 : 0,
                        ),
                      }}
                    >
                      {el.tipo === "nome" && (
                        <span className="w-full text-[11px] font-bold text-slate-900 px-0.5 text-center border-b-2 border-slate-900 pb-0.5">
                          {product.nome}
                        </span>
                      )}
                      {el.tipo === "preco" && (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 bg-white">
                          <div className="text-white text-[7px] font-bold text-center leading-none px-2 py-0.5 shrink-0 rounded-[2px] border border-slate-900 bg-slate-900">
                            Total R$
                          </div>
                          <div
                            className="w-full flex-1 flex items-center justify-center text-[13px] font-bold text-white leading-none border border-slate-900 bg-slate-900"
                            style={{
                              clipPath:
                                "polygon(8% 0%, 92% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)",
                            }}
                          >
                            {formatPrecoValor(product.preco)}
                          </div>
                        </div>
                      )}
                      {el.tipo === "precoUnitario" && (
                        <span className="w-full text-[9px] text-slate-900 text-left px-0.5 whitespace-nowrap">
                          Preço/{product.unidadeVenda === "PECA" ? "pç" : "kg"}: R$ {formatPrecoValor(product.preco)}
                        </span>
                      )}
                      {el.tipo === "pesoBrutoLiquido" && (
                        <span className="w-full text-[9px] text-slate-900 text-center">B</span>
                      )}
                      {el.tipo === "peso" && (
                        <span className="w-full text-[9px] text-slate-900 text-left px-0.5 whitespace-nowrap">
                          Peso: {PESO_EXEMPLO}
                        </span>
                      )}
                      {el.tipo === "tara" && (
                        <span className="w-full text-[9px] text-slate-900 text-left px-0.5 whitespace-nowrap">
                          Tara: {TARA_EXEMPLO}
                        </span>
                      )}
                      {el.tipo === "validade" && (
                        <span className="w-full text-[9px] text-slate-900 text-left px-0.5 whitespace-nowrap">
                          Validade: {formatDataMaisDias(product.validadeDias)}
                        </span>
                      )}
                      {el.tipo === "dataEmbalagem" && (
                        <span className="w-full text-[9px] text-slate-900 text-left px-0.5 whitespace-nowrap">
                          Data: {formatDataMaisDias(0)}
                        </span>
                      )}
                      {el.tipo === "lote" && (
                        <span className="w-full text-[9px] text-slate-900 text-left px-0.5">Lote: —</span>
                      )}
                      {el.tipo === "textoExtra5" && (
                        <span className="w-full text-[9px] text-slate-700 text-left px-0.5">
                          {product.textoExtra5 ?? TIPO_LABEL.textoExtra5}
                        </span>
                      )}
                      {el.tipo === "textoExtra7" && (
                        <span className="w-full text-[9px] text-slate-700 text-left px-0.5">
                          {product.textoExtra7 ?? TIPO_LABEL.textoExtra7}
                        </span>
                      )}
                      {el.tipo === "texto" && <span className="text-[10px] text-slate-700">{el.texto}</span>}
                      {el.tipo === "imagem" &&
                        (imagem ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imagem.url} alt={imagem.nome} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-slate-400">{TIPO_LABEL.imagem}</span>
                        ))}
                      {el.tipo === "tabelaNutricional" &&
                        (tabelaNutricional ? (
                          <div className="w-full h-full overflow-auto text-left px-0.5">
                            <p className="text-[7px] font-bold text-slate-900 leading-tight">INFORMAÇÃO NUTRICIONAL</p>
                            {tabelaNutricional.porcao && (
                              <p className="text-[6px] text-slate-600 leading-tight">
                                Porção: {tabelaNutricional.porcao}
                                {tabelaNutricional.porcoesPorEmbalagem
                                  ? ` · ${tabelaNutricional.porcoesPorEmbalagem} porções/embalagem`
                                  : ""}
                              </p>
                            )}
                            <table className="w-full text-[6px] mt-0.5 border-collapse border border-slate-900">
                              <thead>
                                <tr>
                                  <th className="border border-slate-400 py-0.5 px-1 text-left font-semibold text-slate-900">
                                    &nbsp;
                                  </th>
                                  <th className="border border-slate-400 py-0.5 px-1 text-right font-semibold text-slate-900 whitespace-nowrap">
                                    Valor
                                  </th>
                                  <th className="border border-slate-400 py-0.5 px-1 text-right font-semibold text-slate-900 whitespace-nowrap">
                                    %VD*
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {NUTRIENTES_PADRAO.map((padrao, i) => {
                                  const ordem = i + 1;
                                  const item = tabelaNutricional.itens.find((it) => it.ordem === ordem);
                                  return (
                                    <tr key={ordem}>
                                      <td className="border border-slate-400 py-0.5 pr-1 pl-1 text-slate-700">
                                        {padrao.nome}
                                      </td>
                                      <td className="border border-slate-400 py-0.5 px-1 text-right text-slate-700 whitespace-nowrap">
                                        {item?.valor ?? 0}
                                        {UNIDADE_LABEL[padrao.unidade]}
                                      </td>
                                      <td className="border border-slate-400 py-0.5 px-1 text-right text-slate-500 whitespace-nowrap">
                                        {item?.porcentagem ?? 0}%
                                      </td>
                                    </tr>
                                  );
                                })}
                                {tabelaNutricional.itens
                                  .filter((item) => item.ordem > 10)
                                  .map((item) => (
                                    <tr key={item.ordem}>
                                      <td className="border border-slate-400 py-0.5 pr-1 pl-1 text-slate-700">
                                        {item.ingrediente}
                                      </td>
                                      <td className="border border-slate-400 py-0.5 px-1 text-right text-slate-700 whitespace-nowrap">
                                        {item.valor}
                                        {UNIDADE_LABEL[item.unidade] ?? ""}
                                      </td>
                                      <td className="border border-slate-400 py-0.5 px-1 text-right text-slate-500 whitespace-nowrap">
                                        {item.porcentagem}%
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                            <p className="text-[5px] text-slate-400 leading-tight mt-0.5">
                              *% Valores Diários de referência com base em uma dieta de 2.000 kcal.
                            </p>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400">{TIPO_LABEL.tabelaNutricional}</span>
                        ))}
                      {el.tipo === "ingredientes" &&
                        (tabelaNutricional?.ingredientes ? (
                          <p className="w-full h-full overflow-auto text-[6px] text-slate-600 leading-tight text-left px-0.5">
                            Ingredientes: {tabelaNutricional.ingredientes}
                          </p>
                        ) : (
                          <span className="text-[9px] text-slate-400">{TIPO_LABEL.ingredientes}</span>
                        ))}
                      {el.tipo === "selos" &&
                        (tabelaNutricional && tabelaNutricional.selos.length > 0 ? (
                          <div className="w-full h-full flex items-stretch gap-1 overflow-hidden border border-slate-900 rounded-md px-1 py-0.5">
                            <span className="flex items-center gap-0.5 px-1.5 rounded-full border border-slate-900 text-slate-900 text-[6px] font-bold leading-none whitespace-nowrap shrink-0 self-center">
                              <Search className="w-2 h-2 shrink-0" strokeWidth={3} /> ALTO EM
                            </span>
                            {tabelaNutricional.selos.map((selo) => (
                              <span
                                key={selo}
                                className="flex-1 min-w-0 flex items-center justify-center px-1 py-0.5 rounded bg-slate-900 text-white text-[5.5px] font-bold leading-[1.1] text-center"
                              >
                                {selo.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400">{TIPO_LABEL.selos}</span>
                        ))}
                      {el.tipo === "codigoBarras" && (
                        <svg
                          ref={(node) => {
                            if (node) barcodeRefs.current.set(el.id, node);
                            else barcodeRefs.current.delete(el.id);
                          }}
                          className="max-w-full max-h-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
