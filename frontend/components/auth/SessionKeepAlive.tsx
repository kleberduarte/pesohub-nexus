"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authApi, getLastSessionId, setLastSessionId } from "../../lib/api";

/**
 * Sessão que dura enquanto a pessoa está trabalhando (card #48).
 *
 * Antes o token valia 15 minutos fixos e não havia como renovar: quem estava
 * no meio de um cadastro era deslogado do mesmo jeito. Agora o backend expira
 * por *inatividade* — e este componente é o outro lado disso: enquanto houver
 * interação, ele renova; quando a pessoa larga a tela, ele avisa antes de a
 * sessão cair, como fazem os bancos.
 */

/** Janela de inatividade do backend (SessionRevocationService). */
const INATIVIDADE_MS = 10 * 60 * 1000;

/** Quanto antes do fim o aviso aparece. */
const AVISO_ANTES_MS = 60 * 1000;

/**
 * Intervalo mínimo entre renovações. Sem isso, cada clique viraria um POST —
 * o objetivo é manter a sessão viva, não conversar com o servidor a cada
 * mousemove.
 */
const INTERVALO_RENOVACAO_MS = 4 * 60 * 1000;

const EVENTOS_DE_ATIVIDADE = ["mousedown", "keydown", "scroll", "touchstart"];

/**
 * De quanto em quanto tempo esta aba confere se a sessão ainda é a dela.
 *
 * Duas abas do mesmo navegador compartilham o cookie: quando alguém faz login
 * de novo, a aba antiga passa a usar a sessão nova em silêncio, sem tomar 401.
 * Esta checagem é o que torna esse caso visível.
 */
const INTERVALO_CHECAGEM_MS = 30 * 1000;

/**
 * Canal e trava compartilhados entre as abas. Abas do mesmo navegador dividem o
 * cookie: se cada uma renova por conta própria, a rotação de uma derruba a
 * outra (card #78). A trava garante um refresh por vez no navegador inteiro, e
 * o canal avisa as demais abas do `jti` novo — sem isso elas achariam que a
 * sessão foi tomada por outra pessoa.
 */
const CANAL_SESSAO = "pesohub-sessao";
const TRAVA_REFRESH = "pesohub-refresh";

function abrirCanal(): BroadcastChannel | null {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CANAL_SESSAO);
}

/** Roda `fn` com a trava entre abas; se outra aba já está renovando, desiste. */
async function comTravaEntreAbas(fn: () => Promise<void>): Promise<void> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks) return fn();
  await locks.request(TRAVA_REFRESH, { ifAvailable: true }, async (trava) => {
    if (trava) await fn();
  });
}

export default function SessionKeepAlive() {
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const [sessaoSubstituida, setSessaoSubstituida] = useState(false);
  const ultimaAtividade = useRef(Date.now());
  const ultimaRenovacao = useRef(Date.now());
  const renovacaoEmCurso = useRef<Promise<void> | null>(null);
  const canal = useRef<BroadcastChannel | null>(null);

  const renovar = useCallback(() => {
    // Uma rajada de eventos de atividade chegava aqui várias vezes antes do
    // primeiro POST voltar, e cada refresh paralelo revogava o anterior. Marcar
    // a renovação antes do await e reaproveitar a promise em curso fecha isso.
    if (renovacaoEmCurso.current) return renovacaoEmCurso.current;
    ultimaRenovacao.current = Date.now();
    renovacaoEmCurso.current = comTravaEntreAbas(async () => {
      const data = await authApi.refresh();
      ultimaAtividade.current = Date.now();
      setSegundosRestantes(null);
      setSessaoSubstituida(false);
      canal.current?.postMessage({ tipo: "renovada", jti: data.user.jti ?? null });
    })
      .catch(() => {
        // 401 aqui já é tratado pelo interceptor do api.ts, que redireciona
        // para o login com a mensagem do motivo.
      })
      .finally(() => {
        renovacaoEmCurso.current = null;
      });
    return renovacaoEmCurso.current;
  }, []);

  useEffect(() => {
    canal.current = abrirCanal();
    if (canal.current) {
      canal.current.onmessage = (evento: MessageEvent<{ tipo: string; jti: string | null }>) => {
        if (evento.data?.tipo !== "renovada") return;
        // Renovação feita por outra aba deste navegador: a sessão continua
        // nossa, só o jti mudou.
        setLastSessionId(evento.data.jti);
        ultimaRenovacao.current = Date.now();
        ultimaAtividade.current = Date.now();
        setSegundosRestantes(null);
        setSessaoSubstituida(false);
      };
    }

    const registrarAtividade = () => {
      ultimaAtividade.current = Date.now();
      // Só renova de fato de tempos em tempos; o resto é contabilidade local.
      if (Date.now() - ultimaRenovacao.current > INTERVALO_RENOVACAO_MS) {
        void renovar();
      }
    };

    EVENTOS_DE_ATIVIDADE.forEach((evento) =>
      window.addEventListener(evento, registrarAtividade, { passive: true }),
    );

    const timer = setInterval(() => {
      const parado = Date.now() - ultimaAtividade.current;
      const restante = INATIVIDADE_MS - parado;
      setSegundosRestantes(restante <= AVISO_ANTES_MS ? Math.max(0, Math.ceil(restante / 1000)) : null);
    }, 1000);

    // Confere se a sessão desta aba ainda é a que o navegador está usando.
    const checagem = setInterval(async () => {
      const conhecido = getLastSessionId();
      if (!conhecido) return;
      try {
        const atual = await authApi.me();
        if (atual.jti && atual.jti !== conhecido) setSessaoSubstituida(true);
      } catch {
        // 401 já é tratado pelo interceptor do api.ts.
      }
    }, INTERVALO_CHECAGEM_MS);

    return () => {
      EVENTOS_DE_ATIVIDADE.forEach((evento) => window.removeEventListener(evento, registrarAtividade));
      clearInterval(timer);
      clearInterval(checagem);
      canal.current?.close();
      canal.current = null;
    };
  }, [renovar]);

  if (sessaoSubstituida) {
    return (
      <div
        role="alertdialog"
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-red-300 bg-red-50 p-4 shadow-lg"
      >
        <p className="text-sm font-semibold text-red-900">Sua conta foi acessada em outro lugar</p>
        <p className="mt-1 text-sm text-red-800">
          Outra pessoa (ou outra aba) entrou com esta conta. Esta aba pode estar operando numa empresa ou
          loja diferente da que você selecionou — confira antes de continuar.
        </p>
        <button
          type="button"
          onClick={() => {
            setLastSessionId(null);
            window.location.reload();
          }}
          className="mt-3 w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Recarregar esta aba
        </button>
      </div>
    );
  }

  if (segundosRestantes === null) return null;

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-lg"
    >
      <p className="text-sm font-semibold text-amber-900">Sua sessão vai expirar</p>
      <p className="mt-1 text-sm text-amber-800">
        Por segurança, você será desconectado em {segundosRestantes}s por inatividade.
      </p>
      <button
        type="button"
        onClick={() => void renovar()}
        className="mt-3 w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
      >
        Continuar conectado
      </button>
    </div>
  );
}
