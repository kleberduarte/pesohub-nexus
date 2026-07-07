"use client";

import { useEffect, useState } from "react";
import { CloudUpload, CheckCircle2, XCircle, Clock } from "lucide-react";
import { devicesApi, syncApi, type Device, ApiError } from "../../../lib/api";

export default function SyncPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("all");
  const [tipo, setTipo] = useState<"INCREMENTAL" | "TOTAL">("INCREMENTAL");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    devicesApi
      .list()
      .then(setDevices)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não foi possível carregar as balanças."));
  }, []);

  const handleStartSync = async () => {
    setStarting(true);
    setError("");
    setMessage("");
    try {
      const deviceIds = selectedDeviceId === "all" ? devices.map((d) => d.id) : [selectedDeviceId];
      const result = await syncApi.create({ deviceIds, tipo });
      setMessage(`${result.queued.length} job(s) de sincronização enfileirado(s) com sucesso.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar a sincronização.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Send Data Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Sincronizar Catálogo (PLU Push)</h2>
            <p className="text-sm text-slate-500">Envio total ou incremental de produtos para as balanças</p>
          </div>
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
            <CloudUpload className="w-6 h-6" />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
        )}
        {message && (
          <div className="mb-4 p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">{message}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Selecionar Balanças</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              <option value="all">Todas as Balanças ({devices.length})</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Sincronização</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sync-type"
                  className="border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={tipo === "INCREMENTAL"}
                  onChange={() => setTipo("INCREMENTAL")}
                />
                <span className="ml-2 text-sm text-slate-600">Incremental (apenas alterados)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sync-type"
                  className="border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={tipo === "TOTAL"}
                  onChange={() => setTipo("TOTAL")}
                />
                <span className="ml-2 text-sm text-slate-600">Total (substitui catálogo)</span>
              </label>
            </div>
          </div>
          <button
            onClick={handleStartSync}
            disabled={starting || devices.length === 0}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center justify-center disabled:opacity-60"
          >
            <CloudUpload className="w-4 h-4 mr-2" />
            {starting ? "Enviando..." : "Iniciar Sincronização"}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Histórico de Sincronização</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Destino</th>
                <th className="px-6 py-4 font-medium">Itens</th>
                <th className="px-6 py-4 font-medium">Data / Hora</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {([] as { id: string; target: string; items: string; date: string; time: string; status: string }[]).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center">
                      <CloudUpload className="w-4 h-4 text-brand-500 mr-2" />
                      <span className="font-medium text-slate-700">{item.target}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{item.items}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-slate-500">
                      <Clock className="w-4 h-4 mr-1.5" />
                      {item.date} às {item.time}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.status === "success" ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 mr-1.5" />
                        Concluído
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        <XCircle className="w-3 h-3 mr-1.5" />
                        Erro (retry automático)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Histórico de sincronização será exibido aqui assim que a persistência de SyncJob estiver implementada no backend.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
