import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RaqueteClub — sua raquete de padel em grupo",
  description:
    "RaqueteClub: clube de compra em grupo. Pague uma mensalidade acessível e receba sua raquete de padel por contemplação.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
