"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Scale,
  PackageSearch,
  LogOut,
  CloudUpload,
  Menu,
  Bell,
  Building2,
  Users,
  FolderTree,
  Tags,
  SlidersHorizontal,
  Settings,
  Wand2,
} from "lucide-react";
import {
  clearToken,
  clientesApi,
  getCurrentUser,
  getToken,
  setActiveClienteToken,
  type ClienteBranding,
  type DecodedUser,
} from "../../lib/api";
import { applyBranding } from "../../lib/branding";

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
  { name: "Usuários", href: "/usuarios", icon: Users },
];

const superadminNavigation = [{ name: "Empresas", href: "/empresas", icon: Building2 }];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [branding, setBranding] = useState<ClienteBranding | null>(null);
  const [user, setUser] = useState<DecodedUser | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setUser(getCurrentUser());
    clientesApi
      .branding()
      .then((data) => {
        setBranding(data);
        applyBranding(data);
        if (data.accessToken) setActiveClienteToken(data.accessToken);
      })
      .catch(() => {
        // sem tenant resolvido ainda (ex: token expirado) — mantém identidade padrão PesoHub
      });
  }, []);

  const navigation =
    user?.role === "SUPERADMIN" ? [...superadminNavigation, ...baseNavigation] : baseNavigation;

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex w-full">
      {/* Sidebar */}
      <div className="w-64 bg-brand-50 border-r border-brand-100 flex flex-col h-screen overflow-y-auto">
        <div className="h-16 flex items-center px-6 border-b border-brand-100 shrink-0 sticky top-0 bg-brand-50 z-10">
          <img
            src={branding?.logoUrl ?? "/pesohub-icon.png"}
            alt={branding?.nome ?? "PesoHub"}
            className="w-8 h-8 mr-2 object-contain"
          />
          <span className="text-2xl font-bold tracking-tight text-brand-950">
            {(branding?.nome ?? "PesoHub").toLowerCase()}
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-brand-900 hover:bg-brand-100/50 hover:text-brand-700"
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-white" : "text-brand-600"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-100 shrink-0 sticky bottom-0 bg-brand-50">
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-sm font-medium text-brand-900 hover:text-brand-700 w-full rounded-lg hover:bg-brand-100/50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-brand-600" />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center">
            <button className="text-slate-500 hover:text-slate-700 md:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 ml-4 md:ml-0">
              {navigation.find((n) => n.href === pathname)?.name || "PesoHub"}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
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
