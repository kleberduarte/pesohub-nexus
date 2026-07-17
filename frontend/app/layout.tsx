import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
