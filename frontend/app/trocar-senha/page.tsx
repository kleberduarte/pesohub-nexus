"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, authApi } from "../../lib/api";

/**
 * Troca de senha obrigatória (card #48).
 *
 * Cai aqui quem está no primeiro acesso (a senha foi definida por um
 * administrador, que portanto a conhece) ou está com a senha vencida. Enquanto
 * não trocar, a senha não é secreta de verdade e não dá para responsabilizar
 * ninguém pelo que a conta fizer.
 */

const REGRAS = [
  "Pelo menos 8 caracteres",
  "Uma letra maiúscula e uma minúscula",
  "Um número",
  "Um caractere especial",
  "Diferente das suas últimas senhas",
];

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (novaSenha !== confirmacao) {
      setErro("A confirmação não confere com a nova senha.");
      return;
    }

    setSalvando(true);
    try {
      await authApi.trocarSenha(senhaAtual, novaSenha);
      router.push("/");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível trocar a senha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-slate-900">Defina uma nova senha</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sua senha atual foi definida por outra pessoa ou já venceu. Escolha uma senha que só você conheça.
        </p>

        <ul className="mt-4 space-y-1 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          {REGRAS.map((regra) => (
            <li key={regra}>• {regra}</li>
          ))}
        </ul>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Senha atual
          <input
            type="password"
            required
            autoComplete="current-password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Nova senha
          <input
            type="password"
            required
            autoComplete="new-password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Confirme a nova senha
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
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
          disabled={salvando}
          className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
