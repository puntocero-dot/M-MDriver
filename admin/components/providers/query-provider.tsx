"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * QueryProvider
 *
 * Wraps the application tree with a React Query QueryClientProvider.
 * The QueryClient is instantiated inside useState so each request in SSR
 * gets a fresh client, while the browser keeps a single stable instance
 * for the lifetime of the session.
 */
export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 1 minute before a background refetch
            staleTime: 60 * 1000,
            // Only retry once on failure to avoid hammering the API
            retry: 1,
            // Show cached data while revalidating in the background
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Show the last successful mutation result while a new one is in-flight
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
