import type { Metadata } from "next";
import { headers } from "next/headers";
// Geist é auto-hospedada pelo pacote: nenhuma requisição externa, o que
// também evita liberar mais um domínio na CSP (card #102).
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { brandingBootScript } from "../lib/branding";

export const metadata: Metadata = {
  title: "Balanças Hub",
  description: "Conectando dados, pesando o futuro",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce desta requisição (middleware.ts, card #71). Sem ele o CSP bloqueia
  // o script de branding e a tela sai com as cores padrão. Ler headers() é
  // também o que torna as páginas dinâmicas — de propósito: página estática
  // congelaria o nonce do build.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: brandingBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
