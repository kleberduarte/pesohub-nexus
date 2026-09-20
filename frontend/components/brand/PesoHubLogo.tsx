/**
 * Marca do PesoHub (card #102).
 *
 * O símbolo junta as duas ideias do produto numa forma só: uma BALANÇA (haste,
 * travessão e base) cujos pratos são NÓS de uma rede — o "hub" que liga as
 * balanças das lojas. Desenhado em vetor para ficar nítido do favicon ao
 * cabeçalho, e com as cores vindas da paleta da empresa ativa, não fixas.
 *
 * Só é usada quando a empresa não tem logo próprio: cliente com marca própria
 * continua vendo a dele.
 */

export function PesoHubMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="PesoHub">
      <defs>
        <linearGradient id="ph-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-600, #004080)" />
          <stop offset="100%" stopColor="var(--color-accent-500, #00bfa5)" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#ph-grad)" />
      <g
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.96"
      >
        {/* travessão e haste: a balança */}
        <path d="M13.5 17.5h21" />
        <path d="M24 17.5v16" />
        <path d="M17.5 33.5h13" />
      </g>
      {/* pratos que também são nós da rede */}
      <circle cx="13.5" cy="17.5" r="3.6" fill="#fff" />
      <circle cx="34.5" cy="17.5" r="3.6" fill="#fff" />
      <circle cx="24" cy="12.6" r="2.6" fill="#fff" />
      {/* ligações do hub, mais discretas que a estrutura */}
      <g stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
        <path d="M15.6 15.1 22 12.9" />
        <path d="M32.4 15.1 26 12.9" />
      </g>
    </svg>
  );
}

export function PesoHubWordmark({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      <span className="text-brand-600">peso</span>
      <span className="text-accent-500">hub</span>
    </span>
  );
}

/** Símbolo + nome, que é como a marca aparece na maior parte das telas. */
export function PesoHubLogo({
  className = "",
  markClassName = "h-11 w-11",
  wordClassName = "text-2xl",
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <PesoHubMark className={markClassName} />
      <PesoHubWordmark className={wordClassName} />
    </span>
  );
}
