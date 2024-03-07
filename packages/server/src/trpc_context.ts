import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export interface CreateContextHooks {
  trpcGetUserId?: ({
    req,
    res,
  }: CreateExpressContextOptions) => string | undefined;
}

export function createContext(hooks: CreateContextHooks) {
  return ({ req, res }: CreateExpressContextOptions) => {
    return { req, res, userId: hooks.trpcGetUserId?.({ req, res }) };
  };
}

export type Context = inferAsyncReturnType<ReturnType<typeof createContext>>;
