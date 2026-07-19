"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { imagensApi, ApiError, type Imagem } from "../../lib/api";
import { ConfirmDialog } from "../ui/ConfirmDialog";

// Balança Atena II imprime imagens de 19x19mm a 19x25mm; usamos ~7.5px/mm
// (equivalente a ~190dpi) como resolução de referência para o preview/arquivo
// gerado — suficiente para impressão térmica sem gerar payloads gigantes.
const PX_PER_MM = 7.5;
const DEFAULT_LARGURA_MM = 19;
const DEFAULT_ALTURA_MM = 19;

function resizeImageToDataUrl(file: File, larguraMm: number, alturaMm: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(larguraMm * PX_PER_MM);
        canvas.height = Math.round(alturaMm * PX_PER_MM);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export function ImagemPanel() {
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Imagem | null>(null);
  const [nome, setNome] = useState("");
  const [larguraMm, setLarguraMm] = useState(DEFAULT_LARGURA_MM);
  const [alturaMm, setAlturaMm] = useState(DEFAULT_ALTURA_MM);
  const [preview, setPreview] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Imagem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    imagensApi
      .list()
      .then(setImagens)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar imagens."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setNome("");
    setLarguraMm(DEFAULT_LARGURA_MM);
    setAlturaMm(DEFAULT_ALTURA_MM);
    setPreview("");
    setModalOpen(true);
  };

  const openEdit = (img: Imagem) => {
    setEditing(img);
    setNome(img.nome);
    setLarguraMm(img.larguraMm ?? DEFAULT_LARGURA_MM);
    setAlturaMm(img.alturaMm ?? DEFAULT_ALTURA_MM);
    setPreview(img.url);
    setModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const dataUrl = await resizeImageToDataUrl(file, larguraMm, alturaMm);
      setPreview(dataUrl);
      if (!nome) setNome(file.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível processar a imagem.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!preview) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { nome, url: preview, larguraMm, alturaMm };
      if (editing) {
        await imagensApi.update(editing.id, payload);
      } else {
        await imagensApi.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar imagem.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await imagensApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir imagem.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Imagem</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Preview</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Tamanho</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            ) : imagens.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma imagem cadastrada.
                </td>
              </tr>
            ) : (
              imagens.map((img) => (
                <tr key={img.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="w-10 h-10 object-contain border border-slate-100 rounded" />
                  </td>
                  <td className="px-4 py-3">{img.nome}</td>
                  <td className="px-4 py-3">
                    {img.larguraMm ?? "-"}mm x {img.alturaMm ?? "-"}mm
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(img)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(img)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editing ? "Editar Imagem" : "Nova Imagem"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Largura (mm)</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={larguraMm}
                    onChange={(e) => setLarguraMm(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Altura (mm)</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={alturaMm}
                    onChange={(e) => setAlturaMm(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Recomendado pela balança: 19x19mm a 19x25mm. Ao trocar a largura/altura, reenvie o arquivo para
                reprocessar o tamanho.
              </p>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" /> {processing ? "Processando..." : "Escolher arquivo"}
                </button>
              </div>
              {preview && (
                <div className="flex justify-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="max-w-full max-h-40 object-contain" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !nome || !preview}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Imagem"
        message="Tem certeza que deseja excluir esta imagem? Essa ação não pode ser desfeita."
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
