import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "M&M Driver — Su Conductor Privado en El Salvador",
  description:
    "Servicio de chófer premium para transporte médico y ejecutivo en El Salvador. Su conductor personal, en su propio vehículo.",
  keywords: ["chófer", "conductor privado", "transporte médico", "El Salvador", "ejecutivo"],
  openGraph: {
    title: "M&M Driver — Su Conductor Privado",
    description: "Bespoke chauffeur service. Transporte médico y ejecutivo en El Salvador.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${manrope.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
