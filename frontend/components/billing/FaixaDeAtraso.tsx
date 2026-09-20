"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { billingApi, getCurrentUser, type AvisoDaRede } from "../../lib/api";

const real = (valor: string) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Vencimento é data de calendário: formatar fora de UTC recua um dia. */
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });

/**
 * Faixa de aviso no topo do sistema quando a rede está em atraso (card #100).
 *
 * Existe porque quem está devendo não entra sozinho na tela de Assinatura: o
 * aviso tem que ir até onde a pessoa trabalha. É discreta de propósito — uma
 * linha, não um bloqueio de tela — e diz de saída que a balança continua
 * funcionando, que é o medo real de quem lê.
 *
 * Nunca quebra a página: se a consulta falhar, a faixa simplesmente não
 * aparece. É um aviso, não uma dependência do sistema.
 */
export default function FaixaDeAtraso() {
  const [aviso, setAviso] = useState<AvisoDaRede | null>(null);

  useEffect(() => {
    let ativo = true;
    billingApi
      .avisoDaRede()
      .then((resposta) => {
        if (ativo) setAviso(resposta);
      })
      .catch(() => {
        // Cobrança não pode derrubar a navegação de quem está trabalhando.
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (!aviso?.emAtraso) return null;

  const bloqueada = aviso.situacao === "BLOQUEADA";
  // Só quem administra a rede resolve o pagamento; para o resto, o aviso
  // explica a situação sem mandar a pessoa a uma tela que ela não acessa.
  const podeResolver = getCurrentUser()?.role === "ADMIN_REDE";

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 px-6 py-2 text-sm border-b ${
        bloqueada ? "bg-red-50 border-red-100 text-red-700" : "bg-amber-50 border-amber-100 text-amber-800"
      }`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="font-medium">
        {bloqueada
          ? "Cadastro e sincronização bloqueados por falta de pagamento."
          : `Fatura de ${real(aviso.valor)} em atraso${aviso.vencimento ? ` desde ${data(aviso.vencimento)}` : ""}.`}
      </span>
      <span className="text-slate-600">
        As balanças seguem pesando e imprimindo.
        {!bloqueada && aviso.bloqueiaEm ? ` O bloqueio começa em ${data(aviso.bloqueiaEm)}.` : ""}
      </span>
      {aviso.linkPagamento && (
        <a
          href={aviso.linkPagamento}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-2"
        >
          Pagar agora
        </a>
      )}
      {podeResolver && (
        <a href="/assinatura" className="font-medium underline underline-offset-2">
          Ver assinatura
        </a>
      )}
    </div>
  );
}
