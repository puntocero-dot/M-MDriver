"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <head>
        <title>M&amp;M Driver — Panel Administrativo</title>
        <meta
          name="description"
          content="Panel de administración para M&M Driver, servicio de chofer ejecutivo premium"
        />
      </head>
      <body className="h-full antialiased" style={{ backgroundColor: "#0A1628" }}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
