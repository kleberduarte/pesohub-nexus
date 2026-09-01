"use client";

import type { Dispatch, SetStateAction } from "react";
import { Check, Copy, X } from "lucide-react";
import type { Agent, CreatedAgent, Device } from "../../lib/api";

interface VincularAgentModalProps {
  linkingDevice: Device;
  agents: Agent[];
  tokenInput: string;
  setTokenInput: Dispatch<SetStateAction<string>>;
  /** Agent recém-criado — o token só é exibível UMA vez, aqui. */
  createdAgent: CreatedAgent | null;
  creatingAgent: boolean;
  linking: boolean;
  copied: boolean;
  onCreateAgent: () => void;
  onLinkAgent: () => void;
  onCopyToken: () => void;
  onClose: () => void;
}

/**
 * Vínculo de uma balança ao Agent Local da loja.
 *
 * Extraído de `devices/page.tsx` (card #64) depois de existirem testes de
 * comportamento — a página tinha 776 linhas e 26 estados.
 *
 * Este vínculo é o que faz a sincronização alcançar o equipamento: sem ele,
 * salvar um layout não sai do servidor (card #51).
 */
export function VincularAgentModal({
  linkingDevice,
  agents,
  tokenInput,
  setTokenInput,
  createdAgent,
  creatingAgent,
  linking,
  copied,
  onCreateAgent,
  onLinkAgent,
  onCopyToken,
  onClose,
}: VincularAgentModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Vincular Agent Local</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500">
            Vinculando <span className="font-medium text-slate-700">{linkingDevice.nome}</span> a um Agent
            Local. Sem esse vínculo a sincronização de produtos não funciona.
          </p>

          {agents.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Agents Locais desta empresa
              </h4>
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                {agents.map((agent) => (
                  <li key={agent.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-slate-700">{agent.lojaId}</span>
                    <span className="text-xs text-slate-400">
                      {agent.ultimoHeartbeat
                        ? `último sinal ${new Date(agent.ultimoHeartbeat).toLocaleString("pt-BR")}`
                        : "sem sinal ainda"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-400">
                Por segurança o token de um Agent Local só é exibido no momento em que ele é criado. Para
                vincular a um agent já existente, use o token salvo no .env do Agent Local dessa loja.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="device-token-do-agent-local" className="block text-sm font-medium text-slate-700 mb-1">Token do Agent Local</label>
            <input id="device-token-do-agent-local"
              type="text"
              placeholder="Cole aqui o AGENT_TOKEN"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
            <button
              onClick={onLinkAgent}
              disabled={linking || !tokenInput.trim()}
              className="mt-3 w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
            >
              {linking ? "Vinculando..." : "Vincular"}
            </button>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Ou crie um novo Agent Local para esta loja
            </h4>
            {createdAgent ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Agent <span className="font-medium">{createdAgent.lojaId}</span> criado. Copie o token
                  abaixo — ele não será mostrado novamente — e use-o no <code>AGENT_TOKEN</code> do Agent
                  Local instalado na loja.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                    {createdAgent.token}
                  </code>
                  <button
                    onClick={onCopyToken}
                    className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
                    title="Copiar token"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  O token já foi preenchido no campo acima — clique em &quot;Vincular&quot; para concluir.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={onCreateAgent}
                disabled={creatingAgent}
                className="w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
              >
                {creatingAgent ? "Gerando..." : "Gerar Agent para a loja atual"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
