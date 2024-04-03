import { QueryClientProvider } from "@tanstack/react-query";
import { trpc, useRootQueryClient, useRootTRPCClient } from "./lib/trpc_client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { OperationsProvider } from "./lib/hooks/use-operations";
import "./lib/analytics";
import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";

function App() {
  const queryClient = useRootQueryClient();
  const trpcClient = useRootTRPCClient();

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PostHogProvider client={posthog}>
        <QueryClientProvider client={queryClient}>
          <OperationsProvider>
            <RouterProvider router={router} />
          </OperationsProvider>
        </QueryClientProvider>
      </PostHogProvider>
    </trpc.Provider>
  );
}

export default App;
