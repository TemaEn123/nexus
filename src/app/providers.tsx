"use client";

import {
  isServer,
  type QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { makeQueryClient } from "@/shared/api/query-client";

let browserQueryClient: QueryClient | undefined;

/**
 * На сервере — новый клиент на каждый запрос (иначе кэш утечёт между юзерами).
 * В браузере — один экземпляр: `useState` в корне с Suspense может выбросить
 * клиент до первого commit.
 */
function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

/**
 * Query только на клиенте. Root layout остаётся Server Component:
 * этот файл — `"use client"`, импорт не делает layout клиентским.
 */
export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
    </QueryClientProvider>
  );
}
