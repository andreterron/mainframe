import { QueryClientProvider } from "@tanstack/react-query";
import { trpc, useRootQueryClient, useRootTRPCClient } from "./lib/trpc_client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { OperationsProvider } from "./lib/hooks/use-operations";
import { PostHogProvider } from "posthog-js/react";
import { posthog } from "./lib/analytics";
import { TooltipProvider } from "./components/ui/tooltip";
import { LoadingBarContainer } from "react-top-loading-bar";

function App() {
  const queryClient = useRootQueryClient();
  const trpcClient = useRootTRPCClient();

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PostHogProvider client={posthog}>
        <QueryClientProvider client={queryClient}>
          <OperationsProvider>
            <TooltipProvider>
              {/* TODO: Use color from a variable, from css or ts */}
              <LoadingBarContainer props={{ color: "#f59e0b" }}>
                <RouterProvider router={router} />
              </LoadingBarContainer>
            </TooltipProvider>
          </OperationsProvider>
        </QueryClientProvider>
      </PostHogProvider>
    </trpc.Provider>
  );
}

export default App;
