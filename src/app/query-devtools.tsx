"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/** Отдельный чанк: в prod `providers.tsx` этот модуль не грузит. */
export function QueryDevtools() {
  return (
    <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
  );
}
