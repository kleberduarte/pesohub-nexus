"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Trash2, Edit2, Wifi, RefreshCw, X, Link2, Copy, Check } from "lucide-react";
import {
  devicesApi,
  agentsApi,
  syncApi,
  getCurrentUser,
  type Device,
  type Agent,
  type CreatedAgent,
  type DiscoveredDevice,
  ApiError,
} from "../../../lib/api";

const emptyForm = { nome: "", ip: "", porta: "33581" };

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Add / edit device modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deviceForm, setDeviceForm] = useState(emptyForm);

  const [isScanning, setIsScanning] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredDevice[] | null>(null);

  // Restart communication
  const [restartingId, setRestartingId] = useState<string | null>(null);

  // Link to Agent Local modal
  const [linkingDevice, setLinkingDevice] = useState<Device | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [newLojaId, setNewLojaId] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [linking, setLinking] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<CreatedAgent | null>(null);
  const [copied, setCopied] = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    setError("");
    if (!getCurrentUser()?.clienteId) {
      setError("Nenhuma empresa selecionada. Escolha uma empresa cadastrada para ver as balanças.");
      setLoading(false);
      return;
    }
    try {
      const [deviceList, agentList] = await Promise.all([devicesApi.list(), agentsApi.list()]);
      setDevices(deviceList);
      setAgents(agentList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar as balanças.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const openAddModal = () => {
    setEditingId(null);
    setDeviceForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setEditingId(device.id);
    setDeviceForm({ nome: device.nome, ip: device.ip, porta: String(device.porta) });
    setIsModalOpen(true);
  };

  const closeDeviceModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDeviceForm(emptyForm);
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...deviceForm, porta: Number(deviceForm.porta) };
      if (editingId) {
        await devicesApi.update(editingId, payload);
        setNotice("Balança atualizada com sucesso.");
      } else {
        await devicesApi.create(payload);
        setNotice("Balança adicionada com sucesso.");
      }
      closeDeviceModal();
      await loadDevices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar a balança.");
    } finally {
      setSaving(false);
    }
  };

  const handleScanNetwork = async () => {
    setIsScanning(true);
    setError("");
    try {
      setDiscovered(await devicesApi.discover());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível buscar balanças na rede.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddDiscovered = async (device: DiscoveredDevice) => {
    setSaving(true);
    try {
      await devicesApi.create({ nome: `Balança ${device.ip}`, ip: device.ip, porta: device.port });
      setDiscovered((prev) => prev?.filter((d) => d.ip !== device.ip) ?? null);
      await loadDevices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar a balança.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await devicesApi.remove(id);
      await loadDevices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover a balança.");
    }
  };

  const handleRestart = async (device: Device) => {
    setRestartingId(device.id);
    setError("");
    try {
      await syncApi.create({ deviceIds: [device.id], tipo: "TOTAL" });
      setNotice(`Sincronização disparada para "${device.nome}". Acompanhe o status em Sincronização.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível reiniciar a comunicação com a balança.");
    } finally {
      setRestartingId(null);
    }
  };

  const openLinkModal = (device: Device) => {
    setLinkingDevice(device);
    setTokenInput("");
    setNewLojaId("");
    setCreatedAgent(null);
    setCopied(false);
  };

  const closeLinkModal = () => {
    setLinkingDevice(null);
    setTokenInput("");
    setNewLojaId("");
    setCreatedAgent(null);
    setCopied(false);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAgent(true);
    setError("");
    try {
      const agent = await agentsApi.create(newLojaId.trim());
      setCreatedAgent(agent);
      setTokenInput(agent.token);
      await loadDevices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar o Agent Local.");
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleLinkAgent = async () => {
    if (!linkingDevice || !tokenInput.trim()) return;
    setLinking(true);
    setError("");
    try {
      await devicesApi.linkAgent(linkingDevice.id, tokenInput.trim());
      setNotice(`Balança "${linkingDevice.nome}" vinculada ao Agent Local.`);
      closeLinkModal();
      await loadDevices();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível vincular a balança a esse Agent Local.");
    } finally {
      setLinking(false);
    }
  };

  const handleCopyToken = async () => {
    if (!createdAgent) return;
    await navigator.clipboard.writeText(createdAgent.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const agentLabel = (agentId?: string | null) => {
    if (!agentId) return null;
    const agent = agents.find((a) => a.id === agentId);
    return agent?.lojaId ?? "Agent desconhecido";
  };

  const filteredDevices = devices.filter(
    (d) => d.nome.toLowerCase().includes(searchTerm.toLowerCase()) || d.ip.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar balança por nome ou IP..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button
            onClick={handleScanNetwork}
            disabled={isScanning}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
          >
            <Search className="w-4 h-4 mr-2" />
            {isScanning ? "Buscando..." : "Buscar na Rede"}
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">{notice}</div>
      )}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}

      {discovered !== null && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Balanças encontradas na rede</h3>
          {discovered.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma balança nova encontrada. Verifique se o Agent Local está conectado e se a
              balança está ligada na rede da loja.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {discovered.map((d) => (
                <li key={d.ip} className="flex items-center justify-between py-2">
                  <span className="font-mono text-sm text-slate-600">
                    {d.ip}:{d.port}
                  </span>
                  <button
                    onClick={() => handleAddDiscovered(d)}
                    disabled={saving}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
                  >
                    Adicionar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Nome da Balança</th>
                <th className="px-6 py-4 font-medium">Endereço IP</th>
                <th className="px-6 py-4 font-medium">Porta</th>
                <th className="px-6 py-4 font-medium">Agent Local</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Carregando balanças...
                  </td>
                </tr>
              )}
              {!loading &&
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{device.nome}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{device.ip}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{device.porta}</td>
                    <td className="px-6 py-4">
                      {device.agentId ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                          {agentLabel(device.agentId)}
                        </span>
                      ) : (
                        <button
                          onClick={() => openLinkModal(device)}
                          className="text-xs font-medium text-slate-500 hover:text-brand-600 underline decoration-dotted"
                        >
                          Não vinculado
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          device.status === "ONLINE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        <Wifi className="w-3 h-3 mr-1.5" />
                        {device.status === "ONLINE" ? "Online" : device.status === "OFFLINE" ? "Offline" : "Não configurado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openLinkModal(device)}
                        className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
                        title="Vincular a um Agent Local"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRestart(device)}
                        disabled={restartingId === device.id}
                        className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50 disabled:opacity-60"
                        title="Reiniciar Comunicação"
                      >
                        <RefreshCw className={`w-4 h-4 ${restartingId === device.id ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        onClick={() => openEditModal(device)}
                        className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(device.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma balança encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Device Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingId ? "Editar Dispositivo" : "Adicionar Dispositivo"}
              </h3>
              <button onClick={closeDeviceModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDevice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Balança</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Balança Frios 02"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={deviceForm.nome}
                  onChange={(e) => setDeviceForm({ ...deviceForm, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço IP</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 192.168.0.155"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  value={deviceForm.ip}
                  onChange={(e) => setDeviceForm({ ...deviceForm, ip: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Porta</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  value={deviceForm.porta}
                  onChange={(e) => setDeviceForm({ ...deviceForm, porta: e.target.value })}
                />
              </div>
              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={closeDeviceModal}
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
      )}

      {/* Link to Agent Local Modal */}
      {linkingDevice && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Vincular Agent Local</h3>
              <button onClick={closeLinkModal} className="text-slate-400 hover:text-slate-600 transition-colors">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Token do Agent Local</label>
                <input
                  type="text"
                  placeholder="Cole aqui o AGENT_TOKEN"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
                <button
                  onClick={handleLinkAgent}
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
                        onClick={handleCopyToken}
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
                  <form onSubmit={handleCreateAgent} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Identificador da loja (ex: loja-centro)"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={newLojaId}
                      onChange={(e) => setNewLojaId(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={creatingAgent}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60 whitespace-nowrap"
                    >
                      {creatingAgent ? "Gerando..." : "Gerar Agent"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
