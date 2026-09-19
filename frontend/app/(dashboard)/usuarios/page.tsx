"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  LockOpen,
  Mail,
  MailX,
  Pencil,
  Search,
  Send,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { usersApi, clientesApi, lojasApi, ApiError, getCurrentUser, type AppUser, type Loja, type UserRole,
  contaBloqueada,
} from "../../../lib/api";

const ROLES_RESTRINGIVEIS_A_LOJA: UserRole[] = ["OPERADOR", "VIEWER"];

const ROLE_OPTIONS: UserRole[] = ["ADMIN", "OPERADOR", "VIEWER"];

// O código do perfil (ADMIN, VIEWER...) é do sistema; quem administra a loja
// precisa do nome e do que cada um pode fazer para escolher certo.
const ROLE_INFO: Record<UserRole, { nome: string; descricao: string; selo: string }> = {
  SUPERADMIN: {
    nome: "Superadmin",
    descricao: "Acesso total, a todas as empresas.",
    selo: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  ADMIN: {
    nome: "Administrador",
    descricao: "Gerencia usuários, lojas e assinatura, em todas as lojas.",
    selo: "bg-brand-50 text-brand-700 ring-brand-200",
  },
  OPERADOR: {
    nome: "Operador",
    descricao: "Cadastra produtos e sincroniza as balanças.",
    selo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  VIEWER: {
    nome: "Visualizador",
    descricao: "Só consulta; não altera nada.",
    selo: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

/** Uma única situação por usuário, da mais urgente para a mais comum. */
function situacao(user: AppUser): { rotulo: string; classe: string } {
  if (contaBloqueada(user)) return { rotulo: "Bloqueada", classe: "bg-red-50 text-red-700 ring-red-200" };
  if (user.convite === "pendente") return { rotulo: "Convite pendente", classe: "bg-sky-50 text-sky-700 ring-sky-200" };
  if (user.convite === "expirado")
    return { rotulo: "Convite expirado", classe: "bg-amber-50 text-amber-700 ring-amber-200" };
  if (user.convite === "cancelado")
    return { rotulo: "Convite cancelado", classe: "bg-slate-100 text-slate-600 ring-slate-200" };
  if (user.mustChangePassword)
    return { rotulo: "Senha provisória", classe: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { rotulo: "Ativo", classe: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
}

const inputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400";

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [novoAberto, setNovoAberto] = useState(false);
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

  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState<UserRole | "TODOS">("TODOS");

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

  const fecharNovo = () => {
    setNovoAberto(false);
    setFormError("");
  };

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
      else setAviso(`Usuário ${criado.email ?? email} cadastrado.`);
      setEmail("");
      setSenha("");
      setRole("OPERADOR");
      setLojaId("");
      setNovoAberto(false);
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

  const contagemPorRole = useMemo(() => {
    const c: Partial<Record<UserRole, number>> = {};
    for (const u of users) c[u.role] = (c[u.role] ?? 0) + 1;
    return c;
  }, [users]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return users.filter(
      (u) => (filtroRole === "TODOS" || u.role === filtroRole) && (!termo || u.email.toLowerCase().includes(termo)),
    );
  }, [users, busca, filtroRole]);

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

  const filtros: (UserRole | "TODOS")[] = ["TODOS", ...roleOptions.filter((r) => contagemPorRole[r])];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Usuários da empresa</h2>
          <p className="text-sm text-slate-500">
            {loading
              ? "Carregando…"
              : `${users.length} ${users.length === 1 ? "pessoa tem" : "pessoas têm"} acesso ao PesoHub nesta empresa.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNovoAberto(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Novo usuário
        </button>
      </div>

      {/* Avisos */}
      {lojasFalharam && (
        <Alerta tipo="atencao">
          Não foi possível carregar a lista de Lojas. <strong>Não salve usuários agora</strong> — a seleção de lojas
          aparece vazia por falha de leitura, e um usuário salvo assim fica sem acesso a nenhuma loja. Recarregue a
          página.
        </Alerta>
      )}
      {error && (
        <Alerta tipo="erro" onFechar={() => setError("")}>
          {error}
        </Alerta>
      )}
      {aviso && (
        <Alerta tipo="sucesso" onFechar={() => setAviso("")}>
          {aviso}
        </Alerta>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden">
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {filtros.map((f) => {
              const ativo = filtroRole === f;
              const qtd = f === "TODOS" ? users.length : contagemPorRole[f] ?? 0;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltroRole(f)}
                  aria-pressed={ativo}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    ativo ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "TODOS" ? "Todos" : ROLE_INFO[f].nome}
                  <span className={`ml-1.5 ${ativo ? "text-slate-300" : "text-slate-400"}`}>{qtd}</span>
                </button>
              );
            })}
          </div>
          <div className="relative md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Buscar usuário"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pelo e-mail"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Usuário</th>
                <th className="px-6 py-3 font-medium">Perfil</th>
                <th className="px-6 py-3 font-medium">Loja</th>
                <th className="px-6 py-3 font-medium">Situação</th>
                <th className="px-6 py-3 font-medium">Desde</th>
                <th className="px-6 py-3 font-medium text-right">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading &&
                [0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-slate-100" />
                        <div className="h-3 w-56 rounded bg-slate-100" />
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading &&
                visiveis.map((user) => {
                  const isSelf = user.id === currentUser?.sub;
                  // Backend recusa editar/excluir um SUPERADMIN se quem está agindo
                  // não for SUPERADMIN — a UI espelha essa regra pra não deixar o
                  // botão clicável só pra devolver um erro.
                  const targetIsSuperadmin = user.role === "SUPERADMIN";
                  const lacksPermission = targetIsSuperadmin && currentUser?.role !== "SUPERADMIN";
                  const editDisabled = lacksPermission;
                  const deleteDisabled = isSelf || lacksPermission;
                  const permissionTitle = "Apenas SUPERADMIN pode gerenciar um usuário SUPERADMIN";
                  const info = ROLE_INFO[user.role];
                  const sit = situacao(user);
                  return (
                    <tr key={user.id} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 shrink-0 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{user.email}</p>
                            {isSelf && <p className="text-xs text-slate-400">Você</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          title={info.descricao}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${info.selo}`}
                        >
                          {info.nome}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {user.perfil ? (
                          user.perfil.nome.replace(/^Loja: /, "")
                        ) : (
                          <span className="text-slate-400">Todas as lojas</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${sit.classe}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {sit.rotulo}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {contaBloqueada(user) && (
                            <AcaoTexto
                              disabled={lacksPermission}
                              onClick={() => handleDesbloquear(user)}
                              title={lacksPermission ? permissionTitle : "Desbloquear conta (sem trocar a senha)"}
                              icone={<LockOpen className="w-3.5 h-3.5" />}
                              cor="text-red-600 hover:bg-red-50"
                            >
                              Desbloquear
                            </AcaoTexto>
                          )}
                          {user.convite && (
                            <AcaoTexto
                              disabled={lacksPermission}
                              onClick={() => void handleReenviarConvite(user)}
                              title={lacksPermission ? permissionTitle : "Reenviar convite (o link anterior deixa de valer)"}
                              icone={<Send className="w-3.5 h-3.5" />}
                              cor="text-sky-700 hover:bg-sky-50"
                            >
                              Reenviar
                            </AcaoTexto>
                          )}
                          {user.convite === "pendente" && (
                            <AcaoIcone
                              disabled={lacksPermission}
                              onClick={() => void handleCancelarConvite(user)}
                              title={lacksPermission ? permissionTitle : "Cancelar convite (o link para de funcionar)"}
                              hover="hover:text-amber-600 hover:bg-amber-50"
                            >
                              <MailX className="w-4 h-4" />
                            </AcaoIcone>
                          )}
                          <AcaoIcone
                            disabled={editDisabled}
                            onClick={() => openEdit(user)}
                            title={editDisabled ? permissionTitle : "Editar usuário"}
                            hover="hover:text-brand-600 hover:bg-brand-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </AcaoIcone>
                          <AcaoIcone
                            disabled={deleteDisabled}
                            onClick={() => setDeleteTarget(user)}
                            title={
                              isSelf
                                ? "Você não pode excluir seu próprio usuário"
                                : lacksPermission
                                  ? permissionTitle
                                  : "Excluir usuário"
                            }
                            hover="hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </AcaoIcone>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!loading && visiveis.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      {users.length === 0 ? "Nenhum usuário cadastrado ainda" : "Nenhum usuário encontrado"}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      {users.length === 0
                        ? "Convide a primeira pessoa pelo botão “Novo usuário”."
                        : "Tente outro e-mail ou limpe o filtro de perfil."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Novo usuário */}
      {novoAberto && (
        <Modal titulo="Novo usuário" subtitulo="Dê acesso ao PesoHub a alguém da empresa." onFechar={fecharNovo}>
          <form onSubmit={handleCreate} className="space-y-5">
            {formError && <Alerta tipo="erro">{formError}</Alerta>}

            <fieldset>
              <legend className="block text-sm font-medium text-slate-700 mb-2">Como a pessoa vai entrar?</legend>
              <div className="grid grid-cols-2 gap-2">
                <OpcaoAcesso
                  ativo={convidar}
                  onClick={() => setConvidar(true)}
                  icone={<Mail className="w-4 h-4" />}
                  titulo="Enviar convite"
                  descricao="Recebe um link e cria a própria senha."
                />
                <OpcaoAcesso
                  ativo={!convidar}
                  onClick={() => setConvidar(false)}
                  icone={<KeyRound className="w-4 h-4" />}
                  titulo="Definir senha"
                  descricao="Você repassa; ela troca no 1º acesso."
                />
              </div>
            </fieldset>

            <div>
              <label htmlFor="usuario-e-mail" className="block text-sm font-medium text-slate-700 mb-1">
                E-mail
              </label>
              <input
                id="usuario-e-mail"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={dominioEmpresa ? `nome@${dominioEmpresa}` : undefined}
                className={inputClass}
              />
              {dominioEmpresa ? (
                <p className="mt-1 text-xs text-slate-400">Precisa ser um e-mail @{dominioEmpresa}</p>
              ) : (
                <p className="mt-1 text-xs text-amber-600">Defina o domínio da empresa antes de cadastrar usuários.</p>
              )}
            </div>

            {!convidar && (
              <div>
                <label htmlFor="usuario-senha" className="block text-sm font-medium text-slate-700 mb-1">
                  Senha
                </label>
                <input
                  id="usuario-senha"
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label htmlFor="usuario-perfil" className="block text-sm font-medium text-slate-700 mb-1">
                Perfil
              </label>
              <select
                id="usuario-perfil"
                value={role}
                onChange={(e) => {
                  const novoRole = e.target.value as UserRole;
                  setRole(novoRole);
                  if (!ROLES_RESTRINGIVEIS_A_LOJA.includes(novoRole)) setLojaId("");
                }}
                className={inputClass}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_INFO[r].nome}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">{ROLE_INFO[role].descricao}</p>
            </div>

            {restringeALoja && (
              <div>
                <label htmlFor="usuario-loja" className="block text-sm font-medium text-slate-700 mb-1">
                  Loja
                </label>
                <select id="usuario-loja" value={lojaId} onChange={(e) => setLojaId(e.target.value)} className={inputClass}>
                  <option value="">Todas as lojas</option>
                  {lojas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
                {!lojaId && (
                  <p className="mt-1 text-xs text-amber-600">
                    Sem uma loja selecionada, esse usuário vai enxergar todas as lojas da empresa.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={creating}
                onClick={fecharNovo}
                className="mt-3 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="mt-3 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating ? "Cadastrando..." : convidar ? "Enviar convite" : "Cadastrar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Editar */}
      {editTarget && (
        <Modal titulo="Editar usuário" subtitulo={editTarget.email} onFechar={() => setEditTarget(null)}>
          <form onSubmit={handleSaveEdit} className="space-y-5">
            {editError && <Alerta tipo="erro">{editError}</Alerta>}
            <div>
              <label htmlFor="usuario-perfil-2" className="block text-sm font-medium text-slate-700 mb-1">
                Perfil
              </label>
              <select
                id="usuario-perfil-2"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className={inputClass}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_INFO[r].nome}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">{ROLE_INFO[editRole].descricao}</p>
            </div>
            <div>
              <label htmlFor="usuario-nova-senha-opcional" className="block text-sm font-medium text-slate-700 mb-1">
                Nova senha (opcional)
              </label>
              <input
                id="usuario-nova-senha-opcional"
                type="password"
                minLength={6}
                value={editSenha}
                onChange={(e) => setEditSenha(e.target.value)}
                placeholder="Deixe em branco para manter a atual"
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditTarget(null)}
                className="mt-3 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="mt-3 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg transition-colors font-semibold disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Excluir */}
      {deleteTarget && (
        <Modal titulo="Excluir usuário" onFechar={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-600">
            <strong className="text-slate-800">{deleteTarget.email}</strong> perde o acesso ao PesoHub na hora. Esta
            ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void confirmDelete()}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-60"
            >
              {deleting ? "Excluindo..." : "Sim, excluir"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Alerta({
  tipo,
  children,
  onFechar,
}: {
  tipo: "erro" | "sucesso" | "atencao";
  children: React.ReactNode;
  onFechar?: () => void;
}) {
  const estilo = {
    erro: { caixa: "text-red-700 bg-red-50 border-red-100", Icone: AlertTriangle },
    atencao: { caixa: "text-amber-800 bg-amber-50 border-amber-100", Icone: AlertTriangle },
    sucesso: { caixa: "text-emerald-700 bg-emerald-50 border-emerald-100", Icone: CheckCircle2 },
  }[tipo];
  const { Icone } = estilo;
  return (
    <div className={`flex items-start gap-2.5 p-3 text-sm border rounded-lg ${estilo.caixa}`} role={tipo === "erro" ? "alert" : "status"}>
      <Icone className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
      {onFechar && (
        <button type="button" onClick={onFechar} aria-label="Fechar aviso" className="opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function Modal({
  titulo,
  subtitulo,
  onFechar,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-label={titulo} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-800">{titulo}</h3>
            {subtitulo && <p className="text-sm text-slate-500 truncate">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function OpcaoAcesso({
  ativo,
  onClick,
  icone,
  titulo,
  descricao,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`text-left rounded-xl border p-3 transition-colors ${
        ativo ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <span className={`flex items-center gap-2 text-sm font-medium ${ativo ? "text-brand-700" : "text-slate-700"}`}>
        {icone}
        {titulo}
      </span>
      <span className="block mt-1 text-xs text-slate-500">{descricao}</span>
    </button>
  );
}

function AcaoIcone({
  title,
  hover,
  disabled,
  onClick,
  children,
}: {
  title: string;
  hover: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-2 text-slate-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent ${hover}`}
    >
      {children}
    </button>
  );
}

function AcaoTexto({
  title,
  cor,
  icone,
  disabled,
  onClick,
  children,
}: {
  title: string;
  cor: string;
  icone: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${cor}`}
    >
      {icone}
      {children}
    </button>
  );
}
