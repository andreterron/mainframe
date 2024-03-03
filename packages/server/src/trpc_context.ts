import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
export function createContext({ req, res }: CreateExpressContextOptions) {
  return { req, res };
}
export type Context = inferAsyncReturnType<typeof createContext>;
