"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

interface Props {
  children: React.ReactNode;
}

export function Providers({ children }: Props) {
  // One client per browser session; useState keeps it stable across re-renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            // Never retry client errors (401/403/404/422) — only transient failures.
            retry: (failureCount, error) =>
              !(error instanceof ApiError && error.failure.status >= 400 && error.failure.status < 500) && failureCount < 2,
          },
          mutations: { retry: false },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
