"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { X } from "lucide-react";

/** Campos do formulário. `porta` é texto enquanto está sendo digitado. */
export interface DeviceForm {
  nome: string;
  ip: string;
  porta: string;
}

interface BalancaFormModalProps {
  form: DeviceForm;
  setForm: Dispatch<SetStateAction<DeviceForm>>;
  editingId: string | null;
  saving: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

/**
 * Cadastro e edição de uma balança.
 *
 * Extraído de `devices/page.tsx` (card #64) depois de existirem testes de
 * comportamento cobrindo o cadastro.
 *
 * O IP daqui é DHCP e muda sozinho — quando ele fica errado, o sintoma chega
 * como "timeout na sincronização" e manda investigar rede em vez do cadastro.
 */
export function BalancaFormModal({
  form,
  setForm,
  editingId,
  saving,
  onSubmit,
  onClose,
}: BalancaFormModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">
            {editingId ? "Editar Dispositivo" : "Adicionar Dispositivo"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="device-nome-da-balanca" className="block text-sm font-medium text-slate-700 mb-1">Nome da Balança</label>
            <input id="device-nome-da-balanca"
              type="text"
              required
              placeholder="Ex: Balança Frios 02"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="device-endereco-ip" className="block text-sm font-medium text-slate-700 mb-1">Endereço IP</label>
            <input id="device-endereco-ip"
              type="text"
              required
              placeholder="Ex: 192.168.0.155"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              value={form.ip}
              onChange={(e) => setForm({ ...form, ip: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="device-porta" className="block text-sm font-medium text-slate-700 mb-1">Porta</label>
            <input id="device-porta"
              type="text"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              value={form.porta}
              onChange={(e) => setForm({ ...form, porta: e.target.value })}
            />
          </div>
          <div className="pt-4 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
