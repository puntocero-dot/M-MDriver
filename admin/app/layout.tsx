"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Metadata must be exported from a Server Component — moved to separate export
// since we need QueryClientProvider (client component)

function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
