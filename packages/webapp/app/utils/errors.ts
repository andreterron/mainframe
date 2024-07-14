import { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@mainframe-api/server";

export function isTrpcNotFoundError(error?: TRPCClientErrorLike<AppRouter>) {
  return error?.data?.code === "NOT_FOUND";
}
