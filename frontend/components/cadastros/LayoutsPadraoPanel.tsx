"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatosImpressaoApi, ApiError, type FormatoImpressao } from "../../lib/api";
import { LAYOUTS_PADRAO, type LayoutPadrao } from "../../lib/layouts-padrao";

/**
 * Aba somente-leitura com os modelos de etiqueta de fábrica da Ramuza.
 *
 * Somente leitura por decisão: se a pessoa editasse o modelo e o estragasse,
 * não haveria de onde voltar. "Usar este modelo" copia para um formato novo da
 * loja, que aí sim é editável no editor visual.
 */

/** Faixa aceita pela balança para o LabelID — fora dela a gravação é
 *  silenciosamente descartada (ver CreateFormatoImpressaoDto). */
const NUMERO_MIN = 1;
const NUMERO_MAX = 99;

/** Escala da miniatura. O maior modelo tem 170mm de altura; a 1,4px/mm ele cabe
 *  no card sem espremer os de 30mm a ponto de virarem borrão. */
const MINI_PX_PER_MM = 1.4;

function Miniatura({ layout }: { layout: LayoutPadrao }) {
  return (
    <div
      className="relative bg-white border border-slate-300 rounded-sm shrink-0 overflow-hidden"
      style={{ width: layout.larguraMm * MINI_PX_PER_MM, height: layout.alturaMm * MINI_PX_PER_MM }}
    >
      {layout.elementos.map((el, i) => {
        const tipo = String(el.tipo ?? "");
        const linha = tipo === "borda" || tipo === "divisoria";
        return (
          <div
            key={i}
            className={linha ? "absolute bg-slate-800" : "absolute bg-slate-300"}
            style={{
              left: Number(el.x ?? 0) * MINI_PX_PER_MM,
              top: Number(el.y ?? 0) * MINI_PX_PER_MM,
              width: Math.max(Number(el.largura ?? 0) * MINI_PX_PER_MM, 1),
              height: Math.max(Number(el.altura ?? 0) * MINI_PX_PER_MM, 1),
            }}
          />
        );
      })}
    </div>
  );
}

export function LayoutsPadraoPanel() {
  const [formatos, setFormatos] = useState<FormatoImpressao[]>([]);
  const [usando, setUsando] = useState<LayoutPadrao | null>(null);
  const [numero, setNumero] = useState(NUMERO_MIN);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = () => {
    formatosImpressaoApi
      .list()
      .then(setFormatos)
      .catch(() => setFormatos([]));
  };

  useEffect(carregar, []);

  const ocupados = useMemo(() => new Set(formatos.map((f) => f.numero)), [formatos]);

  /** Primeiro slot livre: o número é único por loja, e deixar a pessoa
   *  descobrir isso no erro do backend seria trabalho à toa. */
  const proximoLivre = useMemo(() => {
    for (let n = NUMERO_MIN; n <= NUMERO_MAX; n++) if (!ocupados.has(n)) return n;
    return NUMERO_MIN;
  }, [ocupados]);

  const abrir = (layout: LayoutPadrao) => {
    setUsando(layout);
    setNumero(proximoLivre);
    setNome(layout.nome);
    setError(null);
  };

  const confirmar = async () => {
    if (!usando) return;
    setSalvando(true);
    setError(null);
    try {
      const criado = await formatosImpressaoApi.create({
        numero,
        nome,
        tipo: 1,
        larguraMm: usando.larguraMm,
        alturaMm: usando.alturaMm,
        layout: { elementos: usando.elementos },
      });
      const balancas = criado.sincronizacao?.balancas ?? 0;
      setAviso(
        balancas > 0
          ? `Formato ${criado.numero} "${criado.nome}" criado e enviado para ${balancas === 1 ? "1 balança" : `${balancas} balanças`}. Ajuste o layout na aba Formato de Impressão.`
          : `Formato ${criado.numero} "${criado.nome}" criado. Nenhuma balança com Agent Local vinculado nesta loja — nada foi enviado.`,
      );
      setUsando(null);
      carregar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao copiar o modelo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Layouts padrão</h2>
        <p className="text-sm text-slate-500">
          Modelos de fábrica da Ramuza, prontos para uso. São somente leitura: use um como ponto de partida e
          o ajuste é feito na cópia, em Formato de Impressão.
        </p>
      </div>

      {error && !usando && (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LAYOUTS_PADRAO.map((layout) => (
          <div
            key={layout.id}
            className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col items-center gap-3"
          >
            <div className="flex-1 flex items-center justify-center min-h-[120px]">
              <Miniatura layout={layout} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-900">{layout.nome}</p>
              <p className="text-xs text-slate-500">
                {layout.larguraMm}mm x {layout.alturaMm}mm · {layout.elementos.length} elementos
              </p>
            </div>
            <button
              onClick={() => abrir(layout)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              <Copy className="w-4 h-4" />
              Usar este modelo
            </button>
          </div>
        ))}
      </div>

      {usando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Usar &quot;{usando.nome}&quot;</h3>
            <p className="text-sm text-slate-500 mb-4">
              Cria um formato novo desta loja com {usando.elementos.length} elementos, {usando.larguraMm}mm x{" "}
              {usando.alturaMm}mm.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Número ({NUMERO_MIN} a {NUMERO_MAX})
                </label>
                <input
                  type="number"
                  min={NUMERO_MIN}
                  max={NUMERO_MAX}
                  value={numero}
                  onChange={(e) => setNumero(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
                {ocupados.has(numero) && (
                  <p className="text-xs text-amber-700 mt-1">
                    Já existe um formato com este número nesta loja. Livre: {proximoLivre}.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setUsando(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={salvando || nome.trim() === "" || ocupados.has(numero)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {salvando ? "Copiando..." : "Criar formato"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
