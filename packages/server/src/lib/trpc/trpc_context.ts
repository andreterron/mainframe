import { inferAsyncReturnType } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { Context as HonoContext } from "hono";
import { Env } from "../../types";

export interface UserInfo {
  id: string;
  email?: string;
  name?: string;
}

export interface CreateContextHooks<E extends Env = Env> {
  trpcGetUserInfo?: (
    c: HonoContext<E>,
  ) => Promise<UserInfo | undefined> | UserInfo | undefined;
  getApiKey?: (
    userId: string | undefined,
  ) => Promise<string | undefined> | string | undefined;
}

// TODO: Rename function
export function createContext<E extends Env = Env>(
  hooks: CreateContextHooks<E>,
) {
  return async (_opts: FetchCreateContextFnOptions, c: HonoContext<E>) => ({
    honoContext: c,
    req: c.req,
    user: await hooks.trpcGetUserInfo?.(c),
    // TODO: Remove non-null assertion
    db: c.var.db!,
    operations: c.var.operations,
    hooks,
  });
}

export type Context = inferAsyncReturnType<ReturnType<typeof createContext>>;
