"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Search, Trash2, Plus } from "lucide-react";
import {
  authApi,
  clientesApi,
  getCurrentUser,
  ApiError,
  type ClienteParametros,
  type UpdateClienteParametrosInput,
} from "../../../lib/api";

const HEX6 = /^#[0-9A-Fa-f]{6}$/;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Record<string, string>;

function formFromParametros(p: ClienteParametros): UpdateClienteParametrosInput {
  return {
    nome: p.nome ?? "",
    logoUrl: p.logoUrl ?? "",
    tagline: p.tagline ?? "",
    corPrimaria: p.corPrimaria ?? "#2563eb",
    corSecundaria: p.corSecundaria ?? "#1e3a8a",
    corFundo: p.corFundo ?? "#f9fafb",
    corTexto: p.corTexto ?? "#111827",
    corBotao: p.corBotao ?? "#2563eb",
    corBotaoTexto: p.corBotaoTexto ?? "#ffffff",
    chavePix: p.chavePix ?? "",
    suporteEmail: p.suporteEmail ?? "",
    suporteWhatsapp: p.suporteWhatsapp ?? "",
  };
}

const COLOR_FIELDS = [
  ["corPrimaria", "Primária"],
  ["corSecundaria", "Secundária"],
  ["corFundo", "Fundo"],
  ["corTexto", "Texto"],
  ["corBotao", "Botão"],
  ["corBotaoTexto", "Texto do botão"],
] as const;

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<ClienteParametros[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");

  const [newNome, setNewNome] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClienteParametros | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateClienteParametrosInput | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadEmpresas = () =>
    clientesApi
      .list()
      .then(setEmpresas)
      .catch((err) => setListError(err instanceof ApiError ? err.message : "Não foi possível carregar as empresas."))
      .finally(() => setLoading(false));

  const loadParametros = () => {
    setFormLoading(true);
    setFormError("");
    clientesApi
      .getMe()
      .then((p) => {
        const next = formFromParametros(p);
        setForm(next);
        setInitialSnapshot(JSON.stringify(next));
      })
      .catch(() => setForm(null))
      .finally(() => setFormLoading(false));
  };

  useEffect(() => {
    const user = getCurrentUser();
    setActiveCompanyId(user?.clienteId ?? null);
    loadEmpresas();
    if (user?.clienteId) loadParametros();
    else setFormLoading(false);
  }, []);

  const hasUnsavedChanges = useMemo(
    () => form !== null && JSON.stringify(form) !== initialSnapshot,
    [form, initialSnapshot],
  );

  const filteredEmpresas = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ordered = [...empresas].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    if (!q) return ordered;
    return ordered.filter((e) => e.nome.toLowerCase().includes(q));
  }, [empresas, search]);

  const activeCompany = empresas.find((e) => e.id === activeCompanyId) ?? null;
  const defaultCompany = empresas.find((e) => e.isDefault) ?? null;
  const canRestore = !!defaultCompany && !!activeCompanyId && activeCompanyId !== defaultCompany.id;

  const handleSelect = async (id: string) => {
    if (id === activeCompanyId) return;
    if (hasUnsavedChanges && !window.confirm("Existem alterações não salvas. Deseja trocar de empresa e descartá-las?")) {
      return;
    }
    setSwitchingId(id);
    setListError("");
    try {
      await authApi.switchCompany(id);
      window.location.href = "/empresas";
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Não foi possível entrar nessa empresa.");
      setSwitchingId(null);
    }
  };

  const handleCreate = async () => {
    const nome = newNome.trim();
    if (nome.length < 3) {
      setListError("Informe pelo menos 3 caracteres no nome da nova empresa.");
      return;
    }
    setCreating(true);
    setListError("");
    try {
      await clientesApi.create(nome);
      setNewNome("");
      await loadEmpresas();
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Não foi possível criar a empresa.");
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await clientesApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadEmpresas();
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Não foi possível excluir a empresa.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  function validateLocal(f: UpdateClienteParametrosInput): FieldErrors {
    const e: FieldErrors = {};
    const nome = (f.nome ?? "").trim();
    if (nome.length < 3 || nome.length > 200) e.nome = "Nome da empresa: entre 3 e 200 caracteres.";
    const logo = (f.logoUrl ?? "").trim();
    if (logo && !/^https?:\/\//i.test(logo)) e.logoUrl = "Informe uma URL http ou https válida.";
    for (const [key] of COLOR_FIELDS) {
      const v = (f[key] ?? "").trim();
      if (v && !HEX6.test(v)) e[key] = "Use o formato #RRGGBB (ex.: #2563eb).";
    }
    const pix = (f.chavePix ?? "").trim();
    if (pix.length > 77) e.chavePix = "Chave PIX: máximo 77 caracteres.";
    const se = (f.suporteEmail ?? "").trim();
    if (se && !EMAIL_OK.test(se)) e.suporteEmail = "E-mail inválido.";
    const sw = (f.suporteWhatsapp ?? "").trim();
    if (sw.length > 32) e.suporteWhatsapp = "WhatsApp de suporte: máximo 32 caracteres.";
    return e;
  }

  const handleRestore = async () => {
    if (!defaultCompany) return;
    if (
      !window.confirm(
        `Isso vai trocar a empresa ativa de volta para "${defaultCompany.nome}" (empresa padrão). Os dados de ${activeCompany?.nome ?? "esta empresa"} não são alterados. Continuar?`,
      )
    ) {
      return;
    }
    setRestoring(true);
    setListError("");
    try {
      await authApi.switchCompany(defaultCompany.id);
      window.location.href = "/empresas";
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Não foi possível voltar para a empresa padrão.");
      setRestoring(false);
    }
  };

  const setCor = (field: (typeof COLOR_FIELDS)[number][0], hex: string) => {
    if (!form) return;
    const v = hex.startsWith("#") ? hex : `#${hex}`;
    setForm({ ...form, [field]: v.slice(0, 7) });
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError("");
    setSaveSuccess(false);
    const errors = validateLocal(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Corrija os campos destacados.");
      setSaving(false);
      return;
    }
    setFieldErrors({});
    const payload: UpdateClienteParametrosInput = {
      ...form,
      nome: (form.nome ?? "").trim(),
      logoUrl: (form.logoUrl ?? "").trim() || undefined,
      tagline: (form.tagline ?? "").trim() || undefined,
      chavePix: (form.chavePix ?? "").trim() || undefined,
      suporteEmail: (form.suporteEmail ?? "").trim() || undefined,
      suporteWhatsapp: (form.suporteWhatsapp ?? "").trim() || undefined,
    };
    try {
      const saved = await clientesApi.updateMe(payload);
      const next = formFromParametros(saved);
      setForm(next);
      setInitialSnapshot(JSON.stringify(next));
      setSaveSuccess(true);
      await loadEmpresas();
      window.setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Não foi possível salvar os parâmetros.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-800">Empresas cadastradas</h2>
            <p className="text-sm text-slate-500">
              Selecione uma empresa para aplicar a identidade visual dela e editar seus parâmetros.
            </p>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <input
              className="w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Nome da empresa"
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreate();
                }
              }}
            />
            <button
              type="button"
              disabled={creating || newNome.trim().length < 3}
              onClick={() => void handleCreate()}
              className="flex items-center px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm disabled:opacity-60 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" />
              {creating ? "Criando..." : "Nova"}
            </button>
          </div>
        </div>

        {listError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg mb-4">{listError}</div>
        )}

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {loading && <p className="text-sm text-slate-500">Carregando empresas...</p>}
        {!loading && filteredEmpresas.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma empresa encontrada.</p>
        )}

        <ul className="space-y-2">
          {filteredEmpresas.map((empresa) => {
            const isActive = empresa.id === activeCompanyId;
            return (
              <li
                key={empresa.id}
                className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${
                  isActive ? "border-brand-300 bg-brand-50/60" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  disabled={switchingId !== null}
                  onClick={() => handleSelect(empresa.id)}
                  className="flex flex-1 items-center gap-3 min-w-0 text-left disabled:opacity-60"
                >
                  {empresa.logoUrl ? (
                    <img src={empresa.logoUrl} alt={empresa.nome} className="w-9 h-9 rounded-lg object-contain shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{empresa.nome}</p>
                    <p className="text-xs text-slate-500">
                      {switchingId === empresa.id ? "Entrando..." : isActive ? "Empresa ativa" : "Clique para entrar"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {empresa.corPrimaria && (
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: empresa.corPrimaria }}
                      />
                    )}
                    {empresa.corSecundaria && (
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: empresa.corSecundaria }}
                      />
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {empresa.isDefault && (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                      Default
                    </span>
                  )}
                  {isActive && (
                    <span className="inline-flex rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      Ativa
                    </span>
                  )}
                  {!empresa.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(empresa)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      title="Excluir empresa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {activeCompanyId && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-800">
              Parâmetros de {activeCompany?.nome ?? "empresa ativa"}
            </h2>
            <p className="text-sm text-slate-500">
              Identidade visual, tema e contatos de suporte aplicados a esta empresa.
            </p>
          </div>

          {formLoading && <p className="text-sm text-slate-500">Carregando parâmetros...</p>}

          {!formLoading && form && (
            <form onSubmit={handleSave} className="space-y-6">
              {saveSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3 text-sm">
                  Parâmetros salvos com sucesso.
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Identidade</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome da empresa *</label>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      fieldErrors.nome ? "border-red-400" : "border-slate-200"
                    }`}
                  />
                  {fieldErrors.nome && <p className="text-xs text-red-600 mt-1">{fieldErrors.nome}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL do logo</label>
                  <input
                    value={form.logoUrl ?? ""}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://..."
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      fieldErrors.logoUrl ? "border-red-400" : "border-slate-200"
                    }`}
                  />
                  {fieldErrors.logoUrl && <p className="text-xs text-red-600 mt-1">{fieldErrors.logoUrl}</p>}
                  {(form.logoUrl ?? "").match(/^https?:\/\//i) && (
                    <img
                      src={form.logoUrl}
                      alt="Preview do logo"
                      className="mt-2 h-12 w-auto max-w-[160px] rounded border border-slate-200 bg-slate-50 object-contain p-1"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem de boas-vindas</label>
                  <textarea
                    value={form.tagline ?? ""}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    rows={2}
                    maxLength={500}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      fieldErrors.tagline ? "border-red-400" : "border-slate-200"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Aparência (tema)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COLOR_FIELDS.map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        {label}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={form[key]?.match(HEX6) ? form[key] : "#2563eb"}
                          onChange={(e) => setCor(key, e.target.value)}
                          className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                        />
                        <input
                          value={form[key] ?? ""}
                          onChange={(e) => setCor(key, e.target.value)}
                          maxLength={7}
                          placeholder="#RRGGBB"
                          className={`flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                            fieldErrors[key] ? "border-red-400" : "border-slate-200"
                          }`}
                        />
                      </div>
                      {fieldErrors[key] && <p className="text-xs text-red-600 mt-1">{fieldErrors[key]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Comercial e suporte</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Chave PIX</label>
                    <input
                      value={form.chavePix ?? ""}
                      onChange={(e) => setForm({ ...form, chavePix: e.target.value })}
                      maxLength={77}
                      placeholder="E-mail, CPF/CNPJ, telefone ou EVP"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        fieldErrors.chavePix ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {fieldErrors.chavePix && <p className="text-xs text-red-600 mt-1">{fieldErrors.chavePix}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail suporte</label>
                    <input
                      type="email"
                      value={form.suporteEmail ?? ""}
                      onChange={(e) => setForm({ ...form, suporteEmail: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        fieldErrors.suporteEmail ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {fieldErrors.suporteEmail && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.suporteEmail}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp suporte</label>
                    <input
                      value={form.suporteWhatsapp ?? ""}
                      onChange={(e) => setForm({ ...form, suporteWhatsapp: e.target.value })}
                      maxLength={32}
                      placeholder="DDD + número, ex: 11999998888"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        fieldErrors.suporteWhatsapp ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {fieldErrors.suporteWhatsapp && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.suporteWhatsapp}</p>
                    )}
                  </div>
                </div>
              </div>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className={`text-xs ${hasUnsavedChanges ? "text-amber-700" : "text-emerald-700"}`}>
                  {hasUnsavedChanges ? "Existem alterações pendentes." : "Sem alterações pendentes."}
                </p>
                <div className="flex gap-2">
                  {canRestore && (
                    <button
                      type="button"
                      disabled={restoring || saving}
                      onClick={() => void handleRestore()}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-60"
                    >
                      {restoring ? "Voltando..." : "Restaurar (voltar para padrão)"}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar parâmetros"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Excluir empresa</h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja excluir <strong>{deleteTarget.nome}</strong>? Esta ação é irreversível.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60"
              >
                {deleting ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
