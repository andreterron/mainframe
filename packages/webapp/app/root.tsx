import { type LinksFunction } from "@remix-run/node";
import {
    Links,
    LiveReload,
    Meta,
    Scripts,
    ScrollRestoration,
    V2_MetaFunction,
} from "@remix-run/react";
import stylesheet from "~/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { trpc } from "./lib/trpc_client";
import { httpBatchLink } from "@trpc/client";
import { ClientOnly } from "remix-utils";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: stylesheet },
];

export const meta: V2_MetaFunction = () => [{ title: "Mainframe" }];

export default function App() {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    // TODO: Update to `/trpc` once everything is hosted
                    //       on the same endpoint
                    url: "http://localhost:8745/trpc",
                }),
            ],
        }),
    );
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <html lang="en">
                    <head>
                        <meta charSet="utf-8" />
                        <meta
                            name="viewport"
                            content="width=device-width,initial-scale=1"
                        />
                        <Meta />
                        <Links />
                    </head>
                    <body>
                        {/* TODO: Remove <ClientOnly> when we disable SSR */}
                        <ClientOnly>
                            {() => <RouterProvider router={router!} />}
                        </ClientOnly>
                        <ScrollRestoration />
                        <Scripts />
                        <LiveReload />
                    </body>
                </html>
            </QueryClientProvider>
        </trpc.Provider>
    );
}
