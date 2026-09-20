"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Scale, CloudUpload, Tags, LineChart } from "lucide-react";
import { login, ApiError, takeSessionEndReason, type ClienteBranding } from "../../lib/api";

interface LoginCardProps {
  branding: ClienteBranding | null;
  onLoginSuccess?: () => Promise<void> | void;
}

/**
 * Login no padrão que o mercado consolidou (card #102): duas colunas, com o
 * institucional num cartão claro à esquerda e o formulário limpo à direita —
 * rótulos acima dos campos, botão de largura total e muito espaço em branco.
 *
 * A identidade continua sendo a da empresa ativa: logo, nome e cores vêm do
 * branding, e o layout só emoldura isso.
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

  const brandName = branding?.nome ?? "PesoHub";
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
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-300 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="flex min-h-screen items-center bg-white p-4 lg:p-8">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Institucional — cartão claro, escondido no celular para o formulário
            aparecer primeiro em tela pequena. */}
        <aside className="relative hidden overflow-hidden rounded-3xl bg-slate-50 p-12 lg:flex lg:min-h-[38rem] lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Plataforma de gestão de balanças
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900">
              {tagline.endsWith(".") ? tagline.slice(0, -1) : tagline}.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-500">
              Produtos, etiquetas e balanças de todas as lojas em um lugar só — com sincronização
              acompanhada de perto.
            </p>
          </div>

          <ul className="relative z-10 mt-10 space-y-4">
            {[
              { icone: Scale, texto: "Balanças conectadas e monitoradas em tempo real" },
              { icone: Tags, texto: "Etiquetas e tabela nutricional sem retrabalho" },
              { icone: CloudUpload, texto: "Sincronização com registro do que foi para cada equipamento" },
              { icone: LineChart, texto: "Visão de todas as lojas, sem misturar dados" },
            ].map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/70">
                  <Icone className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="text-sm leading-relaxed text-slate-600">{texto}</span>
              </li>
            ))}
          </ul>

          <p className="relative z-10 text-sm text-slate-400">
            © {new Date().getFullYear()} {brandName}
          </p>
        </aside>

        {/* Autenticação */}
        <main className="flex w-full justify-center px-2 py-10 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-10 flex flex-col items-center lg:items-start">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt={brandName} className="h-12 object-contain" />
              ) : (
                <span className="text-3xl font-bold tracking-tight">
                  <span className="text-brand-600">PESO</span>
                  <span className="text-accent-500">HUB</span>
                </span>
              )}
              {branding?.logoUrl && (
                <span className="mt-2 text-lg font-semibold tracking-tight text-slate-800">{brandName}</span>
              )}
            </div>

            <h2 className="text-xl font-semibold tracking-[0.2px] text-slate-900">Acesse sua conta</h2>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {sessionEndReason && !error && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  {sessionEndReason}
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600" role="alert">
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

            {/* No PesoHub não existe autocadastro: o acesso nasce de um convite. */}
            <p className="mt-8 text-center text-sm text-slate-500">
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
                O acesso é criado pelo administrador da sua empresa, que envia um convite por e-mail.
                No link do convite você define a sua própria senha — ninguém mais fica sabendo dela.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
