import type { Metadata } from "next";
import "./globals.css";
import { brandingBootScript } from "../lib/branding";

export const metadata: Metadata = {
  title: "PesoHub",
  description: "Conectando dados, pesando o futuro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: brandingBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
