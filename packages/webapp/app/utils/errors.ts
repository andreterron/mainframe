import { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@mainframe-so/node";

export function isTrpcNotFoundError(error?: TRPCClientErrorLike<AppRouter>) {
  return error?.data?.code === "NOT_FOUND";
}
