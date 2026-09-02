"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Trash2, Edit2, Wifi, RefreshCw, Link2, Upload } from "lucide-react";
import {
  devicesApi,
  agentsApi,
  syncApi,
  getCurrentUser,
  type Device,
  type Agent,
  type CreatedAgent,
  type DiscoveredDevice,
  type ImportDeviceRow,
  type ImportDevicesLojaResult,
  ApiError,
} from "../../../lib/api";
import { splitCsvLine } from "../../../lib/csv";
import { BalancaFormModal } from "../../../components/devices/BalancaFormModal";
import { ImportarBalancasModal } from "../../../components/devices/ImportarBalancasModal";
import { VincularAgentModal } from "../../../components/devices/VincularAgentModal";

const emptyForm = { nome: "", ip: "", porta: "33581" };

function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Add / edit device modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deviceForm, setDeviceForm] = useState(emptyForm);

  const [isScanning, setIsScanning] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredDevice[] | null>(null);

  // Bulk CSV import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportDevicesLojaResult[] | null>(null);
  const [importError, setImportError] = useState("");
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Restart communication
  const [restartingId, setRestartingId] = useState<string | null>(null);

  // Link to Agent Local modal
  const [linkingDevice, setLinkingDevice] = useState<Device | null>(null);
  const [tokenInput, setTokenInput] = useState("");
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
      const [devicePage, agentList] = await Promise.all([devicesApi.list(page, pageSize), agentsApi.list()]);
      setDevices(devicePage.data);
      setTotal(devicePage.total);
      setAgents(agentList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar as balanças.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
      const found = await devicesApi.discover();
      const knownIps = new Set(devices.map((d) => d.ip));
      setDiscovered(found.filter((d) => !knownIps.has(d.ip)));
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

  const openImportModal = () => {
    setImportResult(null);
    setImportError("");
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportResult(null);
    setImportError("");
  };

  const handleImportClick = () => importFileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImportError("");
    setImportResult(null);
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setImportError("O arquivo CSV não contém nenhuma linha de dados.");
        return;
      }
      const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
      const rows: ImportDeviceRow[] = lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        const get = (key: string) => values[header.indexOf(key)] ?? "";
        const porta = get("porta");
        return {
          lojaId: get("lojaid"),
          nome: get("nome"),
          ip: get("ip"),
          porta: porta ? Number(porta) : undefined,
        };
      });
      const result = await devicesApi.import(rows);
      setImportResult(result);
      await loadDevices();
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : "Não foi possível importar o arquivo CSV.");
    } finally {
      setImporting(false);
    }
  };

  const handleExportTokens = () => {
    if (!importResult) return;
    const header = ["lojaId", "agentId", "agentToken", "devicesCreated"];
    const rows = importResult.map((r) =>
      [r.lojaId, r.agentId, r.agentToken ?? "(já existente)", r.devicesCreated].map(csvEscape).join(","),
    );
    const csvContent = [header.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agents-tokens.csv";
    a.click();
    URL.revokeObjectURL(url);
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
    setCreatedAgent(null);
    setCopied(false);
  };

  const closeLinkModal = () => {
    setLinkingDevice(null);
    setTokenInput("");
    setCreatedAgent(null);
    setCopied(false);
  };

  const handleCreateAgent = async () => {
    const lojaId = getCurrentUser()?.lojaId;
    if (!lojaId) {
      // "Troque de loja" mandava fazer algo impossível para quem tem uma loja
      // só — e era o caso mais provável de cair aqui, antes da adoção
      // automática da primeira loja (ver layout.tsx). A mensagem agora diz o
      // que de fato resolve.
      setError(
        "Nenhuma loja ativa nesta sessão. Recarregue a página; se o problema continuar, " +
          "cadastre uma loja em Lojas antes de gerar o Agent Local.",
      );
      return;
    }
    setCreatingAgent(true);
    setError("");
    try {
      const agent = await agentsApi.create(lojaId);
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
            placeholder="Buscar balança por nome ou IP (nesta página)..."
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
            onClick={openImportModal}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
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
        {!loading && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 text-sm text-slate-500">
            <span>
              Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total} balança(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-2">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Device Modal */}
      {isModalOpen && (
        <BalancaFormModal
          form={deviceForm}
          setForm={setDeviceForm}
          editingId={editingId}
          saving={saving}
          onSubmit={handleSaveDevice}
          onClose={closeDeviceModal}
        />
      )}

      {/* Link to Agent Local Modal */}
      {linkingDevice && (
        <VincularAgentModal
          linkingDevice={linkingDevice}
          agents={agents}
          tokenInput={tokenInput}
          setTokenInput={setTokenInput}
          createdAgent={createdAgent}
          creatingAgent={creatingAgent}
          linking={linking}
          copied={copied}
          onCreateAgent={() => void handleCreateAgent()}
          onLinkAgent={() => void handleLinkAgent()}
          onCopyToken={() => void handleCopyToken()}
          onClose={closeLinkModal}
        />
      )}
      {/* Bulk CSV Import Modal */}
      <input
        ref={importFileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImportFile}
      />
      {isImportModalOpen && (
        <ImportarBalancasModal
          importing={importing}
          importError={importError}
          importResult={importResult}
          onEscolherArquivo={handleImportClick}
          onExportarTokens={handleExportTokens}
          onClose={closeImportModal}
        />
      )}
    </div>
  );
}
