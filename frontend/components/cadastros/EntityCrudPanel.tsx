"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { ApiError } from "../../lib/api";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export type FieldType = "text" | "number" | "textarea" | "checkbox" | "select";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface EntityCrudPanelProps<T extends { id: string }> {
  title: string;
  emptyMessage?: string;
  fields: FieldConfig[];
  columns: ColumnConfig<T>[];
  list: () => Promise<T[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (data: any) => Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (id: string, data: any) => Promise<T>;
  remove: (id: string) => Promise<void>;
  toFormState?: (item: T) => Record<string, unknown>;
  emptyForm: Record<string, unknown>;
  /** Habilita import/export CSV usando as `fields` (apenas text/number/textarea/select simples). Default: true. */
  csv?: boolean;
  csvFileName?: string;
}

function csvEscape(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function splitCsvLine(line: string): string[] {
  return line.split(",").map((field) => field.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
}

export function EntityCrudPanel<T extends { id: string }>({
  title,
  emptyMessage = "Nenhum registro cadastrado.",
  fields,
  columns,
  list,
  create,
  update,
  remove,
  toFormState,
  emptyForm,
  csv = true,
  csvFileName,
}: EntityCrudPanelProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const simpleFields = fields.filter((f) => f.type !== "checkbox");

  const load = () => {
    setLoading(true);
    list()
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar dados."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    setForm(toFormState ? toFormState(item) : (item as unknown as Record<string, unknown>));
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await update(editing.id, form);
      } else {
        await create(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar registro.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const header = simpleFields.map((f) => f.key);
    const rows = items.map((item) => {
      const rowData = toFormState ? toFormState(item) : (item as unknown as Record<string, unknown>);
      return header.map((key) => csvEscape(rowData[key])).join(",");
    });
    const csvContent = [header.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${csvFileName ?? title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setError("O arquivo CSV não contém nenhuma linha de dados.");
        return;
      }
      const header = splitCsvLine(lines[0]);
      const failures: string[] = [];
      let ok = 0;
      for (const line of lines.slice(1)) {
        const values = splitCsvLine(line);
        const row: Record<string, unknown> = {};
        header.forEach((key, i) => {
          const field = simpleFields.find((f) => f.key === key);
          row[key] = field?.type === "number" ? Number(values[i] ?? 0) : (values[i] ?? "");
        });
        try {
          await create(row);
          ok++;
        } catch (err) {
          failures.push(err instanceof ApiError ? err.message : "erro desconhecido");
        }
      }
      load();
      if (failures.length > 0) {
        setError(`${ok} importado(s), ${failures.length} falharam: ${failures.slice(0, 5).join("; ")}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler o arquivo CSV.");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir registro.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <div className="flex gap-2">
          {csv && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleImportFile}
              />
              <button
                onClick={handleImportClick}
                disabled={importing}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-60"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Importar CSV
              </button>
              <button
                onClick={handleExport}
                disabled={items.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-60"
              >
                <Download className="w-4 h-4" /> Exportar CSV
              </button>
            </>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 font-medium text-slate-500">
                  {col.label}
                </th>
              ))}
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-slate-700">
                      {col.render ? col.render(item) : String((item as unknown as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
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
              {editing ? `Editar ${title}` : `Novo ${title}`}
            </h3>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={(form[field.key] as string) ?? ""}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  ) : field.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
                      className="w-4 h-4"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={(form[field.key] as string) ?? ""}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Selecione...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={(form[field.key] as string | number) ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                </div>
              ))}
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
                disabled={saving}
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
        title={`Excluir ${title}`}
        message={`Tem certeza que deseja excluir este registro? Essa ação não pode ser desfeita.`}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
