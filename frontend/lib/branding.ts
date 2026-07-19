const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

// Mix `hex` toward white (t>0, lighter) or black (t<0, darker). t in [-1, 1].
function mix(hex: string, t: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const target = t >= 0 ? 255 : 0;
  const amount = Math.abs(t);
  const mixChannel = (c: number) => Math.round(c + (target - c) * amount);
  return `#${[mixChannel(r), mixChannel(g), mixChannel(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

// 600 is treated as the "base" shade; lighter steps mix toward white, darker steps toward black.
function shadeScale(baseHex: string): Record<(typeof SHADE_STEPS)[number], string> {
  const offsets: Record<(typeof SHADE_STEPS)[number], number> = {
    50: 0.95,
    100: 0.88,
    200: 0.74,
    300: 0.56,
    400: 0.32,
    500: 0.12,
    600: 0,
    700: -0.18,
    800: -0.34,
    900: -0.5,
    950: -0.68,
  };
  const scale = {} as Record<(typeof SHADE_STEPS)[number], string>;
  for (const step of SHADE_STEPS) {
    scale[step] = mix(baseHex, offsets[step]);
  }
  return scale;
}

export interface Branding {
  nome: string;
  logoUrl?: string | null;
  corPrimaria?: string | null;
  corSecundaria?: string | null;
  tagline?: string | null;
}

export function applyBranding(branding: Pick<Branding, "corPrimaria">) {
  if (typeof document === "undefined" || !branding.corPrimaria) return;
  const scale = shadeScale(branding.corPrimaria);
  const root = document.documentElement.style;
  for (const step of SHADE_STEPS) {
    root.setProperty(`--color-brand-${step}`, scale[step]);
  }
}

export function resetBranding() {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  for (const step of SHADE_STEPS) {
    root.removeProperty(`--color-brand-${step}`);
  }
}
