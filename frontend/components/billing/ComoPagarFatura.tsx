"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, QrCode, FileText } from "lucide-react";
import { billingApi, ApiError, type DadosDePagamento } from "../../lib/api";

/**
 * Como pagar a fatura em aberto, sem sair do sistema (card #101).
 *
 * Mandar o cliente caçar o link no e-mail é onde a maioria desiste: aqui o QR
 * do Pix aparece na tela, e o código copia-e-cola e a linha digitável ficam a
 * um clique. Tudo vem do Asaas em leitura pura — nada é emitido a partir
 * desta tela.
 */
export default function ComoPagarFatura({ faturaId }: { faturaId: string }) {
  const [dados, setDados] = useState<DadosDePagamento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState<"pix" | "boleto" | null>(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");
    billingApi
      .dadosDePagamento(faturaId)
      .then((resposta) => ativo && setDados(resposta))
      .catch((err) => {
        if (!ativo) return;
        setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os dados de pagamento.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [faturaId]);

  const copiar = async (texto: string, qual: "pix" | "boleto") => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(qual);
      setTimeout(() => setCopiado(null), 2500);
    } catch {
      // Área de transferência bloqueada (contexto inseguro, permissão negada):
      // o código segue visível e selecionável na tela, que é o que importa.
      setErro("Não foi possível copiar automaticamente. Selecione o código e copie.");
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando as formas de pagamento...
      </div>
    );
  }

  if (erro && !dados) {
    return <p className="text-sm text-slate-500 py-2">{erro}</p>;
  }
  if (!dados) return null;

  const nadaParaMostrar = !dados.pix && !dados.boleto;

  return (
    <div className="space-y-5">
      {erro && <p className="text-sm text-amber-700">{erro}</p>}

      {dados.pix && (
        <div className="flex flex-col sm:flex-row gap-5">
          {dados.pix.qrCodeBase64 && (
            // eslint-disable-next-line @next/next/no-img-element -- base64 do Asaas, não passa por otimizador
            <img
              src={`data:image/png;base64,${dados.pix.qrCodeBase64}`}
              alt="QR Code do Pix para pagar a fatura"
              className="w-40 h-40 shrink-0 rounded-lg border border-slate-200 bg-white p-2"
            />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-slate-400" />
              Pagar com Pix
            </h4>
            <p className="text-xs text-slate-500">
              Aponte a câmera do aplicativo do banco para o QR, ou use o código copia-e-cola.
            </p>
            <p className="text-xs font-mono text-slate-600 break-all bg-slate-50 border border-slate-200 rounded-lg p-2">
              {dados.pix.copiaECola}
            </p>
            <button
              type="button"
              onClick={() => copiar(dados.pix!.copiaECola, "pix")}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copiado === "pix" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiado === "pix" ? "Código copiado" : "Copiar código Pix"}
            </button>
          </div>
        </div>
      )}

      {dados.boleto && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Pagar com boleto
          </h4>
          <p className="text-xs font-mono text-slate-600 break-all bg-slate-50 border border-slate-200 rounded-lg p-2">
            {dados.boleto.linhaDigitavel}
          </p>
          <button
            type="button"
            onClick={() => copiar(dados.boleto!.linhaDigitavel, "boleto")}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copiado === "boleto" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiado === "boleto" ? "Linha digitável copiada" : "Copiar linha digitável"}
          </button>
        </div>
      )}

      {nadaParaMostrar && (
        <p className="text-sm text-slate-500">
          Esta cobrança não tem Pix nem boleto disponíveis. Use o link da fatura para pagar.
        </p>
      )}

      {dados.linkPagamento && (
        <a
          href={dados.linkPagamento}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-brand-600 hover:underline"
        >
          Abrir a fatura no provedor de pagamento
        </a>
      )}
    </div>
  );
}
