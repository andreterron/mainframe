import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { trpc } from "./lib/trpc_client";
import { httpBatchLink } from "@trpc/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

function App() {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: "/trpc",
                }),
            ],
        }),
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router!} />
            </QueryClientProvider>
        </trpc.Provider>
    );
}

export default App;
