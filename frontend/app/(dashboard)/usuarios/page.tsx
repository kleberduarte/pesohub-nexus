"use client";

import { useEffect, useState } from "react";
import { LockOpen, MailX, Pencil, Send, Trash2 } from "lucide-react";
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
  // Convite por e-mail é o padrão (card #91): a pessoa escolhe a própria
  // senha e ninguém mais a conhece. Senha definida aqui fica como alternativa
  // para quem não tem e-mail confiável na loja.
  const [convidar, setConvidar] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [aviso, setAviso] = useState("");
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojasFalharam, setLojasFalharam] = useState(false);

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
  // Domínio da empresa: mostrado no formulário para a pessoa saber a regra
  // antes de digitar, em vez de descobrir pelo erro depois de submeter.
  const [dominioEmpresa, setDominioEmpresa] = useState<string | null>(null);
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

  // Resultado do envio vira aviso na tela: um convite que não saiu precisa
  // ser visto, senão o convidado fica esperando um e-mail que nunca chega.
  const avisarEnvio = (emailDestino: string, enviado: boolean | undefined) => {
    if (enviado === false) {
      setError(`O convite para ${emailDestino} foi criado, mas o e-mail não pôde ser enviado. Use "Reenviar convite".`);
    } else {
      setAviso(`Convite enviado para ${emailDestino}. O link vale por 7 dias.`);
    }
  };

  const handleReenviarConvite = async (user: AppUser) => {
    setError("");
    setAviso("");
    try {
      const r = await usersApi.reenviarConvite(user.id);
      avisarEnvio(user.email, r.conviteEnviado);
      loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível reenviar o convite.");
    }
  };

  const handleCancelarConvite = async (user: AppUser) => {
    setError("");
    setAviso("");
    try {
      await usersApi.cancelarConvite(user.id);
      setAviso(`Convite de ${user.email} cancelado. O link enviado não funciona mais.`);
      loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cancelar o convite.");
    }
  };

  useEffect(() => {
    loadUsers();
    clientesApi
      .getMe()
      .then((cliente) => {
        setIsDefaultCliente(cliente.isDefault);
        setDominioEmpresa(cliente.dominio ?? null);
      })
      .catch(() => setIsDefaultCliente(false));
    lojasApi
      .list()
      .then((l) => {
        setLojas(l);
        setLojasFalharam(false);
      })
      // Lista vazia aqui define ESCOPO DE ACESSO: um usuário salvo sem loja
      // por falha de leitura fica sem enxergar nada, e o sintoma vira "não
      // consigo ver os produtos" (card #67).
      .catch(() => setLojasFalharam(true));
  }, []);

  const restringeALoja = ROLES_RESTRINGIVEIS_A_LOJA.includes(role);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setError("");
    setAviso("");
    setCreating(true);
    try {
      const criado = await usersApi.create({
        email,
        role,
        ...(convidar ? { convidar: true } : { senha }),
        ...(restringeALoja && lojaId ? { lojaId } : {}),
      });
      if (convidar) avisarEnvio(criado.email, criado.conviteEnviado);
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

      {lojasFalharam && (
        <div className="p-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg">
          Não foi possível carregar a lista de Lojas. <strong>Não salve usuários agora</strong> —
          a seleção de lojas aparece vazia por falha de leitura, e um usuário salvo assim fica sem
          acesso a nenhuma loja. Recarregue a página.
        </div>
      )}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}
      {aviso && (
        <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">{aviso}</div>
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
            <label htmlFor="usuario-e-mail" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input id="usuario-e-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dominioEmpresa ? `nome@${dominioEmpresa}` : undefined}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {dominioEmpresa ? (
              <p className="mt-1 text-xs text-slate-400">Precisa ser um e-mail @{dominioEmpresa}</p>
            ) : (
              <p className="mt-1 text-xs text-amber-600">
                Defina o domínio da empresa antes de cadastrar usuários.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="usuario-senha" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input id="usuario-senha"
              type="password"
              required={!convidar}
              disabled={convidar}
              minLength={6}
              value={convidar ? "" : senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={convidar ? "Definida pelo convidado" : undefined}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="usuario-perfil" className="block text-sm font-medium text-slate-700 mb-1">Perfil</label>
            <select id="usuario-perfil"
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
            <label htmlFor="usuario-loja" className="block text-sm font-medium text-slate-700 mb-1">
              Loja {restringeALoja ? "" : <span className="text-slate-400 font-normal">(opcional)</span>}
            </label>
            <select
              id="usuario-loja"
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
            {creating ? "Cadastrando..." : convidar ? "Convidar" : "Cadastrar"}
          </button>
          <label className="sm:col-span-5 flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={convidar}
              onChange={(e) => setConvidar(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Enviar convite por e-mail
              <span className="block text-xs text-slate-500">
                {convidar
                  ? "A pessoa recebe um link e escolhe a própria senha. Ninguém mais fica sabendo dela."
                  : "Você define a senha inicial e precisa repassá-la; a pessoa troca no primeiro acesso."}
              </span>
            </span>
          </label>
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
                        {user.convite === "pendente" && (
                          <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                            Convite pendente
                          </span>
                        )}
                        {user.convite === "expirado" && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Convite expirado
                          </span>
                        )}
                        {user.convite === "cancelado" && (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            Convite cancelado
                          </span>
                        )}
                        {!contaBloqueada(user) && !user.convite && user.mustChangePassword && (
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
                          {user.convite && (
                            <button
                              type="button"
                              disabled={lacksPermission}
                              onClick={() => void handleReenviarConvite(user)}
                              className="p-2 text-sky-500 hover:text-sky-700 transition-colors rounded-lg hover:bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={lacksPermission ? permissionTitle : "Reenviar convite (o link anterior deixa de valer)"}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {user.convite === "pendente" && (
                            <button
                              type="button"
                              disabled={lacksPermission}
                              onClick={() => void handleCancelarConvite(user)}
                              className="p-2 text-slate-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={lacksPermission ? permissionTitle : "Cancelar convite (o link para de funcionar)"}
                            >
                              <MailX className="w-4 h-4" />
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
                <label htmlFor="usuario-perfil-2" className="block text-sm font-medium text-slate-700 mb-1">Perfil</label>
                <select id="usuario-perfil-2"
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
                <label htmlFor="usuario-nova-senha-opcional" className="block text-sm font-medium text-slate-700 mb-1">Nova senha (opcional)</label>
                <input id="usuario-nova-senha-opcional"
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
