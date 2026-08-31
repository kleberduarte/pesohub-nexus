"use client";

import { useEffect, useState } from "react";
import { LockOpen, Pencil, Trash2 } from "lucide-react";
import { usersApi, clientesApi, lojasApi, ApiError, getCurrentUser, type AppUser, type Loja, type UserRole,
  contaBloqueada,
} from "../../../lib/api";

const ROLES_RESTRINGIVEIS_A_LOJA: UserRole[] = ["OPERADOR", "VIEWER"];

const ROLE_OPTIONS: UserRole[] = ["ADMIN", "OPERADOR", "VIEWER"];

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<UserRole>("OPERADOR");
  const [lojaId, setLojaId] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [lojas, setLojas] = useState<Loja[]>([]);

  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("OPERADOR");
  const [editSenha, setEditSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currentUser = getCurrentUser();
  // SUPERADMIN só existe na empresa padrão — não faz sentido oferecer o
  // perfil pra empresas clientes (Ramuza, etc.), mesmo que quem esteja
  // cadastrando já seja um SUPERADMIN "global" navegando ali.
  const [isDefaultCliente, setIsDefaultCliente] = useState(false);
  const roleOptions =
    currentUser?.role === "SUPERADMIN" && isDefaultCliente ? (["SUPERADMIN", ...ROLE_OPTIONS] as UserRole[]) : ROLE_OPTIONS;

  const loadUsers = () => {
    setLoading(true);
    usersApi
      .list()
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não foi possível carregar os usuários."))
      .finally(() => setLoading(false));
  };

  const handleDesbloquear = async (user: AppUser) => {
    setError("");
    try {
      await usersApi.desbloquear(user.id);
      loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível desbloquear a conta.");
    }
  };

  useEffect(() => {
    loadUsers();
    clientesApi
      .getMe()
      .then((cliente) => setIsDefaultCliente(cliente.isDefault))
      .catch(() => setIsDefaultCliente(false));
    lojasApi
      .list()
      .then(setLojas)
      .catch(() => setLojas([]));
  }, []);

  const restringeALoja = ROLES_RESTRINGIVEIS_A_LOJA.includes(role);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      await usersApi.create({ email, senha, role, ...(restringeALoja && lojaId ? { lojaId } : {}) });
      setEmail("");
      setSenha("");
      setRole("OPERADOR");
      setLojaId("");
      loadUsers();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Não foi possível cadastrar o usuário.");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (user: AppUser) => {
    setEditTarget(user);
    setEditRole(user.role);
    setEditSenha("");
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError("");
    setSaving(true);
    try {
      await usersApi.update(editTarget.id, {
        role: editRole,
        ...(editSenha ? { senha: editSenha } : {}),
      });
      setEditTarget(null);
      loadUsers();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível excluir o usuário.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // Gestão de usuários é exclusiva de quem administra a empresa. O link some
  // do menu pra outros perfis, mas alguém pode digitar a URL direto — aqui é
  // a segunda camada (a real é o backend, que já recusa list/create/etc.).
  if (currentUser && currentUser.role !== "SUPERADMIN" && currentUser.role !== "ADMIN") {
    return (
      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Usuários cadastrados</h2>
        <p className="text-sm text-slate-500">Usuários vinculados à empresa atualmente selecionada.</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Novo usuário</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
          {formError && (
            <div className="sm:col-span-5 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Perfil</label>
            <select
              value={role}
              onChange={(e) => {
                const novoRole = e.target.value as UserRole;
                setRole(novoRole);
                if (!ROLES_RESTRINGIVEIS_A_LOJA.includes(novoRole)) setLojaId("");
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Loja {restringeALoja ? "" : <span className="text-slate-400 font-normal">(opcional)</span>}
            </label>
            <select
              value={lojaId}
              onChange={(e) => setLojaId(e.target.value)}
              disabled={!restringeALoja}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Todas as lojas</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
        {restringeALoja && !lojaId && (
          <p className="text-xs text-amber-600 mt-2">
            Sem uma loja selecionada, esse usuário vai enxergar todas as lojas da empresa.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">E-mail</th>
                <th className="px-6 py-4 font-medium">Perfil</th>
                <th className="px-6 py-4 font-medium">Criado em</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Carregando usuários...
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((user) => {
                  const isSelf = user.id === currentUser?.sub;
                  // Backend recusa editar/excluir um SUPERADMIN se quem está agindo
                  // não for SUPERADMIN — a UI espelha essa regra pra não deixar o
                  // botão clicável só pra devolver um erro.
                  const targetIsSuperadmin = user.role === "SUPERADMIN";
                  const lacksPermission = targetIsSuperadmin && currentUser?.role !== "SUPERADMIN";
                  const editDisabled = lacksPermission;
                  const deleteDisabled = isSelf || lacksPermission;
                  const permissionTitle = "Apenas SUPERADMIN pode gerenciar um usuário SUPERADMIN";
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {user.email}
                        {isSelf && <span className="ml-2 text-xs text-slate-400">(você)</span>}
                        {contaBloqueada(user) && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Bloqueada
                          </span>
                        )}
                        {!contaBloqueada(user) && user.mustChangePassword && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Senha provisória
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {user.role}
                        {user.perfil && (
                          <span className="ml-2 text-xs text-slate-400">
                            ({user.perfil.nome.replace(/^Loja: /, "")})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {contaBloqueada(user) && (
                            <button
                              type="button"
                              disabled={lacksPermission}
                              onClick={() => handleDesbloquear(user)}
                              className="p-2 text-red-500 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={lacksPermission ? permissionTitle : "Desbloquear conta (sem trocar a senha)"}
                            >
                              <LockOpen className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={editDisabled}
                            onClick={() => openEdit(user)}
                            className="p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title={editDisabled ? permissionTitle : "Editar usuário"}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={deleteDisabled}
                            onClick={() => setDeleteTarget(user)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title={
                              isSelf
                                ? "Você não pode excluir seu próprio usuário"
                                : lacksPermission
                                  ? permissionTitle
                                  : "Excluir usuário"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Editar usuário</h3>
            <p className="text-sm text-slate-500 mb-6">{editTarget.email}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Perfil</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha (opcional)</label>
                <input
                  type="password"
                  minLength={6}
                  value={editSenha}
                  onChange={(e) => setEditSenha(e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Excluir usuário</h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja excluir <strong>{deleteTarget.email}</strong>? Esta ação é irreversível.
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
