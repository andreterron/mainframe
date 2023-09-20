import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "~/server/trpc_context";
import { appRouter } from "~/server/trpc_router";
export const loader = async (args: LoaderArgs) => {
    return handleRequest(args);
};
export const action = async (args: ActionArgs) => {
    return handleRequest(args);
};
function handleRequest(args: LoaderArgs | ActionArgs) {
    return fetchRequestHandler({
        endpoint: "/trpc",
        req: args.request,
        router: appRouter,
        createContext,

        onError(opts) {
            const { error, type, path, input, ctx, req } = opts;
            console.error("Error:", error);
            if (error.code === "INTERNAL_SERVER_ERROR") {
                // send to bug reporting
            }
        },
    });
}
