import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ramuza Nexus",
  description: "Plataforma de Gestão Remota de Balanças",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
