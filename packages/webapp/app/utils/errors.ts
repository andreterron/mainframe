import { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "../../server/trpc_router";

export function isTrpcNotFoundError(error?: TRPCClientErrorLike<AppRouter>) {
  return error?.data?.code === "NOT_FOUND";
}
