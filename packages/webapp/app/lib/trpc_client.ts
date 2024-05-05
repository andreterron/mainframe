import {
  TRPCClientError,
  createTRPCReact,
  httpBatchLink,
} from "@trpc/react-query";
import type { AppRouter } from "@mainframe-so/server";
import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { isTrpcNotFoundError } from "../utils/errors";
import { env } from "./env_client";

export const trpc = createTRPCReact<AppRouter>();

export const useRootQueryClient = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
      }),
  );
  return queryClient;
};

export const useRootTRPCClient = () => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${env.VITE_API_URL}/trpc`,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
        }),
      ],
    }),
  );
  return trpcClient;
};
