"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Scale } from "lucide-react";
import { login, setToken, ApiError, type ClienteBranding } from "../../lib/api";

type AuthMode = "login" | "first-access";

function BrandMark({ branding }: { branding: ClienteBranding | null }) {
  if (branding?.logoUrl) {
    return (
      <>
        <img
          src={branding.logoUrl}
          alt={branding.nome}
          className="h-7 w-7 object-contain"
        />
        <span className="text-sm font-semibold tracking-tight">{branding.nome}</span>
      </>
    );
  }

  return (
    <>
      <Scale className="h-4 w-4" strokeWidth={2.25} />
      <span className="text-sm font-semibold tracking-tight">
        PESO<span className="text-accent-500">HUB</span>
      </span>
    </>
  );
}

interface LoginCardProps {
  branding: ClienteBranding | null;
  onLoginSuccess?: () => Promise<void> | void;
}

export default function LoginCard({ branding, onLoginSuccess }: LoginCardProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const brandName = branding?.nome ?? "PesoHub";
  const tagline = branding?.tagline ?? "Conectando dados, pesando o futuro";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { accessToken } = await login(email, password);
      setToken(accessToken);
      if (onLoginSuccess) await onLoginSuccess();
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível conectar à API. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Painel de marca */}
      <aside className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between bg-brand-600 px-12 xl:px-16 py-10 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(0,191,165,0.18),transparent_40%)]" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <BrandMark branding={branding} />
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Plataforma de gestão de balanças
          </p>
          <h1 className="text-4xl xl:text-[2.75rem] font-bold leading-tight tracking-tight">
            {tagline.endsWith(".") ? tagline.slice(0, -1) : tagline}.
          </h1>
          <p className="text-base xl:text-lg leading-relaxed text-white/80">
            Centralize dispositivos, produtos e sincronização em uma experiência fluida e preparada
            para operação em escala.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/50">
          © {new Date().getFullYear()} {brandName}
        </div>
      </aside>

      {/* Área de autenticação */}
      <main className="flex flex-1 flex-col items-center justify-center bg-slate-100/80 px-4 py-10 sm:px-6 lg:px-10">
        {/* Marca compacta no mobile */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={brandName} className="h-9 w-9 object-contain" />
            ) : (
              <Scale className="h-7 w-7 text-brand-600" strokeWidth={2} />
            )}
          </div>
          {branding ? (
            <span className="text-2xl font-bold tracking-tight text-brand-600">{brandName}</span>
          ) : (
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-brand-600">PESO</span>
              <span className="text-accent-500">HUB</span>
            </span>
          )}
          <span className="mt-1 text-sm text-slate-500">{tagline}</span>
        </div>

        <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200/80 bg-white p-7 sm:p-8 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.18)]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Entrar na conta</h2>
            <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
              {brandName}
            </span>
          </div>

          {/* Tabs */}
          <div className="mb-7 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("first-access");
                setError("");
              }}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                mode === "first-access"
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Primeiro acesso
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="relative">
                <label className="absolute -top-2.5 left-3 z-10 bg-white px-1 text-sm font-medium text-slate-500">
                  E-mail
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-3.5 pl-12 pr-4 text-slate-800 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder=" "
                  />
                </div>
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 z-10 bg-white px-1 text-sm font-medium text-slate-500">
                  Senha
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-3.5 pl-12 pr-12 text-slate-800 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder=" "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-brand-600 px-4 py-3.5 font-semibold text-white shadow-[0_4px_14px_rgba(0,64,128,0.28)] transition-all duration-200 hover:bg-brand-700 hover:shadow-[0_6px_20px_rgba(0,64,128,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-600">
                <p className="font-medium text-slate-800">Acesso inicial via convite</p>
                <p className="mt-2">
                  Se esta é a sua primeira vez no sistema, utilize o link de acesso enviado pelo
                  administrador da sua empresa. Esse link já identifica a organização e aplica a
                  identidade visual correta.
                </p>
              </div>
              <p className="text-sm text-slate-500">
                Já possui credenciais? Volte para a aba{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Entrar
                </button>
                .
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
