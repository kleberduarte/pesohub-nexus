"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Scale,
  PackageSearch,
  LogOut,
  CloudUpload,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Building2,
  Users,
  FolderTree,
  Tags,
  SlidersHorizontal,
  Settings,
  Wand2,
  CreditCard,
  Store,
} from "lucide-react";
import {
  authApi,
  clearCurrentUser,
  clientesApi,
  getCurrentUser,
  lojasApi,
  setActiveClienteToken,
  type ClienteBranding,
  type DecodedUser,
  type Loja,
} from "../../lib/api";
import { applyBranding, readCachedBranding } from "../../lib/branding";
import SessionKeepAlive from "../../components/auth/SessionKeepAlive";

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Balanças", href: "/devices", icon: Scale },
  { name: "Assistente", href: "/assistente", icon: Wand2 },
  { name: "Produtos (PLU)", href: "/products", icon: PackageSearch },
  { name: "Cadastros", href: "/cadastros", icon: FolderTree },
  { name: "Etiquetas", href: "/etiquetas", icon: Tags },
  { name: "SPEC", href: "/spec", icon: SlidersHorizontal },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
  { name: "Sincronização", href: "/sync", icon: CloudUpload },
];

// Gestão de usuários/lojas/assinatura é coisa de quem administra a empresa —
// um usuário criado pra operar só numa Loja (OPERADOR/VIEWER) não deve nem
// ver esses links, muito menos acessar as telas por trás deles.
const adminNavigation = [
  { name: "Usuários", href: "/usuarios", icon: Users },
  { name: "Lojas", href: "/lojas", icon: Store },
  { name: "Assinatura", href: "/assinatura", icon: CreditCard },
];

const superadminNavigation = [{ name: "Empresas", href: "/empresas", icon: Building2 }];

const SIDEBAR_STORAGE_KEY = "pesohub:sidebar-collapsed";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [branding, setBranding] = useState<ClienteBranding | null>(null);
  // Enquanto a marca não é conhecida, o cabeçalho fica vazio — mostrar
  // "PesoHub" ali fazia a empresa padrão piscar a cada recarregamento.
  const [brandingResolved, setBrandingResolved] = useState(false);
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [switchingLoja, setSwitchingLoja] = useState(false);
  // Menu lateral recolhido mostra só os ícones; a escolha fica gravada no
  // navegador para não reabrir a cada recarregamento.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((atual) => {
      const novo = !atual;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, novo ? "1" : "0");
      } catch {
        // armazenamento bloqueado — o menu só não lembra a escolha
      }
      return novo;
    });
  };

  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1") setSidebarCollapsed(true);
    } catch {
      // armazenamento bloqueado — segue com o menu aberto
    }
    const cached = readCachedBranding();
    if (cached) {
      setBranding(cached as ClienteBranding);
      setBrandingResolved(true);
    }
  }, []);

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/login");
      return;
    }
    // Confirma a sessão com o backend (fonte de verdade — o cache local de
    // usuário é só para gating de UI otimista). Se o cookie de sessão
    // estiver ausente/expirado, o interceptor 401 do request() redireciona.
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        // request() já trata o redirect em caso de 401
      });
    lojasApi
      .list()
      .then(async (lista) => {
        setLojas(lista);
        // Adota a primeira loja quando a sessão ainda não tem nenhuma ativa.
        //
        // Sem isso, quem cadastra a PRIMEIRA loja fica travado: o escopo da aba
        // segue com `lojaId: null`, o select exibe a loja (é a primeira opção)
        // mas o valor real é "", e escolher a opção já exibida NÃO dispara o
        // onChange — não há como corrigir pela interface. A tela ainda pedia
        // "troque de loja", impossível havendo só uma.
        if (!getCurrentUser()?.lojaId && lista.length > 0) {
          try {
            const { user: atualizado } = await authApi.switchLoja(lista[0].id);
            setUser(atualizado);
          } catch {
            // Sem loja ativa a tela segue utilizável em modo leitura; as ações
            // que exigem loja avisam por conta própria.
          }
        }
      })
      .catch(() => {
        // sem empresa ativa ainda, ou usuário SUPERADMIN sem cliente selecionado
      });
    clientesApi
      .branding()
      .then((data) => {
        setBranding(data);
        applyBranding(data);
        if (data.accessToken) setActiveClienteToken(data.accessToken);
      })
      .catch(() => {
        // sem tenant resolvido ainda (ex: token expirado) — mantém identidade padrão PesoHub
      })
      .finally(() => setBrandingResolved(true));
  }, []);

  const isAdmin = user?.role === "SUPERADMIN" || user?.role === "ADMIN";
  const navigation = [
    ...(user?.role === "SUPERADMIN" ? superadminNavigation : []),
    ...baseNavigation,
    ...(isAdmin ? adminNavigation : []),
  ];

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    clearCurrentUser();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex w-full">
      {/* Renova a sessão enquanto há atividade e avisa antes de expirar. */}
      <SessionKeepAlive />
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } shrink-0 bg-brand-50 border-r border-brand-100 flex flex-col h-screen overflow-y-auto overflow-x-hidden transition-[width] duration-200`}
      >
        <div
          className={`h-16 flex items-center border-b border-brand-100 shrink-0 sticky top-0 bg-brand-50 z-10 ${
            sidebarCollapsed ? "justify-center px-2" : "px-6"
          }`}
        >
          {brandingResolved ? (
            <>
              <img
                src={branding?.logoUrl ?? "/pesohub-icon.png"}
                alt={branding?.nome ?? "PesoHub"}
                className={`w-8 h-8 object-contain ${sidebarCollapsed ? "" : "mr-2"}`}
              />
              {!sidebarCollapsed && (
                <span className="text-2xl font-bold tracking-tight text-brand-950 truncate">
                  {(branding?.nome ?? "PesoHub").toLowerCase()}
                </span>
              )}
            </>
          ) : (
            <div className="w-8 h-8" aria-hidden />
          )}
        </div>

        <nav className={`flex-1 py-6 space-y-1 ${sidebarCollapsed ? "px-3" : "px-4"}`}>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={sidebarCollapsed ? item.name : undefined}
                className={`flex items-center py-3 text-sm font-medium rounded-lg transition-colors ${
                  sidebarCollapsed ? "justify-center px-0" : "px-4"
                } ${
                  isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-brand-900 hover:bg-brand-100/50 hover:text-brand-700"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 ${sidebarCollapsed ? "" : "mr-3"} ${
                    isActive ? "text-white" : "text-brand-600"
                  }`}
                />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={`border-t border-brand-100 shrink-0 sticky bottom-0 bg-brand-50 ${
            sidebarCollapsed ? "p-3" : "p-4"
          }`}
        >
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sair" : undefined}
            className={`flex items-center py-3 text-sm font-medium text-brand-900 hover:text-brand-700 w-full rounded-lg hover:bg-brand-100/50 transition-colors ${
              sidebarCollapsed ? "justify-center px-0" : "px-4"
            }`}
          >
            <LogOut className={`w-5 h-5 shrink-0 text-brand-600 ${sidebarCollapsed ? "" : "mr-3"}`} />
            {!sidebarCollapsed && "Sair"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-6 h-6" />
              ) : (
                <PanelLeftClose className="w-6 h-6" />
              )}
            </button>
            <h1 className="text-xl font-semibold text-slate-800 ml-3">
              {navigation.find((n) => n.href === pathname)?.name || "PesoHub"}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {lojas.length > 0 && (
              <select
                value={user?.lojaId ?? ""}
                disabled={switchingLoja}
                onChange={async (e) => {
                  setSwitchingLoja(true);
                  try {
                    const { user: updated } = await authApi.switchLoja(e.target.value);
                    setUser(updated);
                  } finally {
                    setSwitchingLoja(false);
                  }
                }}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {/* Enquanto não houver loja ativa, o select precisa DIZER isso.
                    Mostrar a primeira loja como se estivesse selecionada era
                    mentira — e ainda impedia a correção, porque escolher a
                    opção já exibida não dispara o onChange. */}
                {!user?.lojaId && (
                  <option value="" disabled>
                    Selecione uma loja
                  </option>
                )}
                {lojas.map((loja) => (
                  <option key={loja.id} value={loja.id}>
                    {loja.nome}
                  </option>
                ))}
              </select>
            )}
            <button className="relative p-2 text-slate-400 hover:text-brand-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold">
                {(user?.email ?? "?").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700">{user?.email ?? "Usuário"}</span>
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
