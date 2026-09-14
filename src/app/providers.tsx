"use client";

import {
  isServer,
  type QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { makeQueryClient } from "@/shared/api/query-client";

let browserQueryClient: QueryClient | undefined;

/**
 * На сервере — новый клиент на каждый запрос (иначе кэш утечёт между юзерами).
 * В браузере — один экземпляр: `useState` под Suspense доски может выбросить
 * клиент до первого commit.
 */
function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

const showQueryDevtools =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_E2E !== "1";

const QueryDevtools = showQueryDevtools
  ? dynamic(() => import("./query-devtools").then((mod) => mod.QueryDevtools), {
      ssr: false,
    })
  : () => null;

/**
 * Query только вокруг канбана (`HydratedKanban`). Root layout — RSC без этого импорта,
 * чтобы `/` и `/login` не тащили TanStack Query.
 * Devtools только в обычном `pnpm dev`: prod и Playwright (`NEXT_PUBLIC_E2E`) без панели.
 */
export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showQueryDevtools ? <QueryDevtools /> : null}
    </QueryClientProvider>
  );
}
