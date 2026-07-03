import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Padel Clube — sua raquete parcelada em grupo",
  description:
    "Clube de contemplação de raquetes de padel. Pague em parcelas, receba sua raquete.",
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
