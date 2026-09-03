import { QueryClient } from "@tanstack/react-query";

/** Один набор defaults для prefetch на сервере и провайдера в браузере. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // После hydrate не сразу refetch — иначе GET может перетереть drag.
        staleTime: 60_000,
        retry: 1,
      },
    },
  });
}
