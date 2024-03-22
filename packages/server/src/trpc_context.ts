import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export interface CreateContextHooks {
  trpcGetUserId?: ({
    req,
    res,
  }: CreateExpressContextOptions) =>
    | Promise<string | undefined>
    | string
    | undefined;
  getApiKey?: (
    userId: string | undefined,
  ) => Promise<string | undefined> | string | undefined;
}

export function createContext(hooks: CreateContextHooks) {
  return async ({ req, res }: CreateExpressContextOptions) => {
    return {
      req,
      res,
      userId: await hooks.trpcGetUserId?.({ req, res }),
      db: req.db,
      hooks,
    };
  };
}

export type Context = inferAsyncReturnType<ReturnType<typeof createContext>>;
