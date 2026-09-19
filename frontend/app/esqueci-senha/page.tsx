"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, authApi } from "../../lib/api";

/**
 * Pedido de redefinição de senha (card #90).
 *
 * A mensagem de sucesso é a mesma exista o e-mail ou não — é o que o backend
 * também faz, para a tela não virar um jeito de descobrir quem tem conta.
 */
export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await authApi.esqueciSenha(email.trim());
      setEnviado(true);
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 429
          ? "Muitas tentativas seguidas. Aguarde um minuto e tente de novo."
          : "Não foi possível enviar agora. Tente novamente em instantes.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Esqueci minha senha</h1>

        {enviado ? (
          <>
            <p className="mt-3 text-sm text-slate-600">
              Se existir uma conta com o e-mail <strong className="text-slate-800">{email.trim()}</strong>, enviamos
              um link para redefinir a senha. Ele vale por 1 hora.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Não chegou em alguns minutos? Confira a caixa de spam ou peça um novo link.
            </p>
            <button
              type="button"
              onClick={() => setEnviado(false)}
              className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Pedir novo link
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mt-1 text-sm text-slate-600">
              Informe o e-mail da sua conta. Vamos enviar um link para você escolher uma nova senha.
            </p>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              E-mail
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            {erro && (
              <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-6 block text-center text-sm text-slate-500 hover:text-slate-700">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
