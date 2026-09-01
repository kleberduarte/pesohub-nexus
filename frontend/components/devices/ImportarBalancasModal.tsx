"use client";

import { Download, Upload, X } from "lucide-react";
import type { ImportDevicesLojaResult } from "../../lib/api";

interface ImportarBalancasModalProps {
  importing: boolean;
  importError: string;
  importResult: ImportDevicesLojaResult[] | null;
  /** Abre o seletor de arquivo — o input fica na página, que detém a ref. */
  onEscolherArquivo: () => void;
  /** Exporta o CSV de tokens dos Agents — o modelo que a pessoa preenche. */
  onExportarTokens: () => void;
  onClose: () => void;
}

/**
 * Importação de balanças em massa por CSV.
 *
 * Extraído de `devices/page.tsx` (card #64).
 *
 * A leitura do CSV usa `lib/csv.ts` desde o commit `06d1c66`: a implementação
 * anterior partia um nome com vírgula e deslocava as colunas, fazendo a balança
 * entrar com IP inválido — cadastrada e inalcançável.
 */
export function ImportarBalancasModal({
  importing,
  importError,
  importResult,
  onEscolherArquivo,
  onExportarTokens,
  onClose,
}: ImportarBalancasModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Importar Balanças em Lote</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-sm text-slate-500">
            Envie um CSV com as colunas <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">lojaId</code>,{" "}
            <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">nome</code>,{" "}
            <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">ip</code> e opcionalmente{" "}
            <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">porta</code> (padrão 33581). Uma linha por
            balança — várias linhas com o mesmo <code className="text-xs bg-slate-50 px-1 py-0.5 rounded">lojaId</code>{" "}
            reaproveitam o mesmo Agent Local daquela loja.
          </p>

          {importError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{importError}</div>
          )}

          {!importResult && (
            <button
              onClick={onEscolherArquivo}
              disabled={importing}
              className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? "Importando..." : "Selecionar arquivo CSV"}
            </button>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">
                {importResult.reduce((sum, r) => sum + r.devicesCreated, 0)} balança(s) importada(s) em{" "}
                {importResult.length} loja(s).
              </div>
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Loja</th>
                      <th className="px-4 py-2 font-medium">Balanças</th>
                      <th className="px-4 py-2 font-medium">Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importResult.map((r) => (
                      <tr key={r.lojaId}>
                        <td className="px-4 py-2 text-slate-700">{r.lojaId}</td>
                        <td className="px-4 py-2 text-slate-500">{r.devicesCreated}</td>
                        <td className="px-4 py-2 text-xs">
                          {r.agentToken ? (
                            <span className="text-emerald-700">novo token gerado</span>
                          ) : (
                            <span className="text-slate-400">agent já existente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400">
                Por segurança, o token de cada Agent Local só é exibido uma vez. Baixe a planilha abaixo e
                entregue aos técnicos que vão instalar o Agent Local em cada loja nova.
              </p>
              <button
                onClick={onExportarTokens}
                className="w-full flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar CSV com os tokens
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
