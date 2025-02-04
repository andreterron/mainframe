import {
  TRPCClientError,
  createTRPCReact,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/react-query";
import type { AppRouter } from "@mainframe-api/server";
import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { isTrpcNotFoundError } from "../utils/errors";
import { env } from "./env_client";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const links = [
  httpBatchLink({
    url: `${env.VITE_API_URL}/trpc`,
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  }),
];

export const trpcProxyClient = createTRPCProxyClient<AppRouter>({
  links,
});

export const trpc = createTRPCReact<AppRouter>();

export const useRootQueryClient = () => {
  const [queryClient] = useState(() => {
    const localStoragePersister = createSyncStoragePersister({
      storage: window.localStorage,
    });
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry(failureCount, error) {
            return (
              // Do not retry "Not Found" errors
              !(
                error instanceof TRPCClientError && isTrpcNotFoundError(error)
              ) && failureCount < 3
            );
          },
        },
      },
    });
    persistQueryClient({
      queryClient: client,
      persister: localStoragePersister,
    });
    return client;
  });
  return queryClient;
};

export const useRootTRPCClient = () => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links,
    }),
  );
  return trpcClient;
};
