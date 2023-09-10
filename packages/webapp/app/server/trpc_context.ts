import { inferAsyncReturnType } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
export function createContext({
    req,
    resHeaders,
}: FetchCreateContextFnOptions) {
    return { req, resHeaders };
}
export type Context = inferAsyncReturnType<typeof createContext>;
