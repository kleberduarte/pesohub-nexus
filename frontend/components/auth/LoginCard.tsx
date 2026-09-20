"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { login, ApiError, takeSessionEndReason, type ClienteBranding } from "../../lib/api";

interface LoginCardProps {
  branding: ClienteBranding | null;
  onLoginSuccess?: () => Promise<void> | void;
}

/**
 * Login claro em duas metades (card #102): formulário à esquerda e a foto do
 * equipamento sangrando até a borda à direita — o produto aparece antes de
 * qualquer texto explicar o que o sistema faz.
 *
 * A foto é preto e branco de propósito: o equipamento tem cores fortes (visor
 * verde, marca do fabricante) que brigariam com a identidade de cada empresa.
 *
 * A marca tem duas versões geradas do mesmo arquivo: a escura para fundo claro,
 * usada aqui, e a prateada para fundo escuro. Empresa com logo próprio continua
 * vendo o dela.
 */
export default function LoginCard({ branding, onLoginSuccess }: LoginCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [explicarAcesso, setExplicarAcesso] = useState(false);
  const router = useRouter();
  // Aviso do fim da sessão anterior ("sua conta foi acessada em outro
  // dispositivo"). É um recado diferente de um erro de login, e some assim que
  // a pessoa tenta entrar de novo.
  const [sessionEndReason, setSessionEndReason] = useState<string | null>(null);

  useEffect(() => {
    setSessionEndReason(takeSessionEndReason());
  }, []);

  const brandName = branding?.nome ?? "Balanças Hub";
  const tagline = branding?.tagline ?? "Conectando dados, pesando o futuro";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSessionEndReason(null);
    setLoading(true);
    try {
      const { user } = await login(email, password);
      if (onLoginSuccess) await onLoginSuccess();
      // Primeiro acesso ou senha vencida: a senha ainda é conhecida por quem
      // criou a conta, então não há sessão útil antes da troca.
      router.push(user.precisaTrocarSenha ? "/trocar-senha" : "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível conectar à API. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const campo =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-800 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* Formulário */}
      <main className="order-2 flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:order-1 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            {branding?.logoUrl ? (
              <span className="inline-flex items-center gap-3">
                <img src={branding.logoUrl} alt={brandName} className="h-11 w-11 object-contain" />
                <span className="text-2xl font-semibold tracking-tight text-slate-800">{brandName}</span>
              </span>
            ) : (
              <img src="/balancashub-logo-escuro.png" alt={brandName} className="h-11 w-auto object-contain" />
            )}
            <p className="mt-6 text-sm text-slate-500">{tagline}</p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Acesse sua conta</h1>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            {sessionEndReason && !error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                {sessionEndReason}
              </div>
            )}

            {error && (
              <div
                className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600"
                role="alert"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-e-mail" className="mb-1.5 block text-sm text-slate-600">
                E-mail
              </label>
              <input
                id="login-e-mail"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={campo}
              />
            </div>

            <div>
              <label htmlFor="login-senha" className="mb-1.5 block text-sm text-slate-600">
                Senha
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-senha"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${campo} pr-12`}
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
              <Link
                href="/esqueci-senha"
                className="mt-2 inline-block text-sm font-medium text-brand-600 underline-offset-2 hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 px-4 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* No sistema não existe autocadastro: o acesso nasce de um convite. */}
          <p className="mt-8 text-sm text-slate-500">
            Primeira vez por aqui?{" "}
            <button
              type="button"
              onClick={() => setExplicarAcesso((v) => !v)}
              className="font-semibold text-brand-600 underline-offset-2 hover:underline"
            >
              Como conseguir acesso
            </button>
          </p>
          {explicarAcesso && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-600">
              O acesso é criado pelo administrador da sua empresa, que envia um convite por e-mail. No
              link do convite você define a sua própria senha — ninguém mais fica sabendo dela.
            </div>
          )}

          <p className="mt-10 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            Sessão única por usuário e dados isolados por loja
          </p>
        </div>
      </main>

      {/* Equipamento — sangra até a borda */}
      <aside className="relative order-1 h-56 overflow-hidden bg-slate-950 sm:h-72 lg:order-2 lg:h-auto lg:w-[46%]">
        <img
          src="/login-balanca.webp"
          alt="Balança de supermercado conectada ao sistema"
          className="h-full w-full object-cover object-center"
        />
        {/* Véu com a cor da marca: costura a foto cinza à identidade da empresa. */}
        <div className="absolute inset-0 bg-brand-600/30 mix-blend-color" />
        {/* Degradê para o branco, para a foto não terminar num corte seco. */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent lg:via-transparent" />

        <p className="absolute bottom-8 left-8 right-8 hidden max-w-sm text-sm leading-relaxed text-white/75 lg:block">
          Produtos, etiquetas e sincronização de todas as balanças da rede — acompanhados de perto.
        </p>
      </aside>
    </div>
  );
}
