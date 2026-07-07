"use client";

import { useEffect, useState } from "react";
import { Scale, Package, Wifi, WifiOff } from "lucide-react";
import { devicesApi, productsApi, type Device, ApiError } from "../../lib/api";

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([devicesApi.list(), productsApi.list()])
      .then(([devicesRes, productsRes]) => {
        setDevices(devicesRes);
        setProductCount(productsRes.length);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não foi possível carregar o painel."))
      .finally(() => setLoading(false));
  }, []);

  const activeDevices = devices.filter((d) => d.status === "ONLINE").length;
  const recentDevices = [...devices]
    .sort((a, b) => (b.ultimoAcesso ?? "").localeCompare(a.ultimoAcesso ?? ""))
    .slice(0, 5);

  const stats = [
    { name: "Balanças Ativas", value: String(activeDevices), icon: Scale },
    { name: "Produtos (PLU)", value: productCount !== null ? productCount.toLocaleString("pt-BR") : "—", icon: Package },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((item) => (
          <div key={item.name} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{item.name}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{loading ? "…" : item.value}</p>
              </div>
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                <item.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Status das Balanças</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Nome / Setor</th>
                <th className="px-6 py-4 font-medium">Endereço IP</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Última Sincronização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Carregando balanças...
                  </td>
                </tr>
              )}
              {!loading &&
                recentDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{device.nome}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{device.ip}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          device.status === "ONLINE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {device.status === "ONLINE" ? (
                          <Wifi className="w-3 h-3 mr-1.5" />
                        ) : (
                          <WifiOff className="w-3 h-3 mr-1.5" />
                        )}
                        {device.status === "ONLINE" ? "Online" : device.status === "OFFLINE" ? "Offline" : "Não configurado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{device.ultimoAcesso ?? "—"}</td>
                  </tr>
                ))}
              {!loading && recentDevices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma balança cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
