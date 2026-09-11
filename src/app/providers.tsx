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
 * Devtools только в обычном `pnpm dev`: prod и Playwright (`NEXT_PUBLIC_E2E`) без панели.
 */
const showQueryDevtools =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_E2E !== "1";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showQueryDevtools ? (
        <ReactQueryDevtools
          buttonPosition="bottom-left"
          initialIsOpen={false}
        />
      ) : null}
    </QueryClientProvider>
  );
}
