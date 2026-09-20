/**
 * Marca do PesoHub (card #102).
 *
 * O símbolo junta as duas ideias do produto numa forma só: uma BALANÇA (haste,
 * travessão e base) cujos pratos são NÓS ligados pelo travessão — o "hub" que
 * liga as balanças das lojas. Vetor, com as cores vindas da paleta da empresa.
 *
 * Desenho propositalmente grosso e com poucos elementos: a primeira versão
 * tinha ligações finas e um nó extra que sumiam no ícone de 32px.
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
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* travessão, haste e base: a balança */}
        <path d="M11 18h26" />
        <path d="M24 18v16.5" />
        <path d="M16.5 34.5h15" />
      </g>
      {/* pratos, que também são os nós ligados pelo travessão */}
      <circle cx="11" cy="18" r="4.6" fill="#fff" />
      <circle cx="37" cy="18" r="4.6" fill="#fff" />
      <circle cx="24" cy="18" r="2.6" fill="#fff" />
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
