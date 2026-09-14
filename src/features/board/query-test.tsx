import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/** Изолированный клиент: без retry и staleTime из `makeQueryClient`. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

export function deferred<T>() {
  const handles = {
    resolve: (_value: T) => {},
    reject: (_reason?: unknown) => {},
  };
  const promise = new Promise<T>((resolve, reject) => {
    handles.resolve = resolve;
    handles.reject = reject;
  });

  return {
    promise,
    resolve: (value: T) => handles.resolve(value),
    reject: (reason?: unknown) => handles.reject(reason),
  };
}
