"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError } from "../../lib/api";

/**
 * Tela de "escolher senha" aberta por um link de e-mail com token de uso
 * único. Serve à redefinição (card #90) e ao aceite de convite (#91): muda só
 * o texto e o endpoint chamado.
 */

const REGRAS = [
  "Pelo menos 8 caracteres",
  "Uma letra maiúscula e uma minúscula",
  "Um número",
  "Um caractere especial",
  "Diferente das suas últimas senhas",
];

interface Props {
  titulo: string;
  descricao?: string;
  /** Texto e destino quando o link não traz token. */
  semToken: { texto: string; linkRotulo?: string; linkHref?: string };
  sucesso: string;
  enviar: (token: string, novaSenha: string) => Promise<unknown>;
}

function Formulario({ descricao, semToken, sucesso, enviar }: Omit<Props, "titulo">) {
  const token = useSearchParams().get("token") ?? "";
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (novaSenha !== confirmacao) {
      setErro("A confirmação não confere com a nova senha.");
      return;
    }
    setSalvando(true);
    try {
      await enviar(token, novaSenha);
      setConcluido(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar a senha.");
    } finally {
      setSalvando(false);
    }
  }

  if (!token) {
    return (
      <>
        <p className="mt-3 text-sm text-slate-600">{semToken.texto}</p>
        {semToken.linkHref && (
          <Link
            href={semToken.linkHref}
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            {semToken.linkRotulo}
          </Link>
        )}
      </>
    );
  }

  if (concluido) {
    return (
      <>
        <p className="mt-3 text-sm text-slate-600">{sucesso}</p>
        <Link
          href="/login"
          className="mt-4 block w-full rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
        >
          Ir para o login
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {descricao && <p className="mt-1 text-sm text-slate-600">{descricao}</p>}

      <ul className="mt-4 space-y-1 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
        {REGRAS.map((regra) => (
          <li key={regra}>• {regra}</li>
        ))}
      </ul>

      <label className="mt-4 block text-sm font-medium text-slate-700">
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
        {salvando ? "Salvando..." : "Salvar senha"}
      </button>
    </form>
  );
}

export default function DefinirSenhaPorLink({ titulo, ...resto }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <img src="/balancashub-logo-escuro.png" alt="Balanças Hub" className="mb-6 h-9 w-auto object-contain" />
        <h1 className="text-lg font-semibold text-slate-900">{titulo}</h1>
        {/* useSearchParams exige Suspense no build de produção do Next 15. */}
        <Suspense fallback={<p className="mt-3 text-sm text-slate-500">Carregando...</p>}>
          <Formulario {...resto} />
        </Suspense>
      </div>
    </div>
  );
}
