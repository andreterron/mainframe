import { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@mainframe-so/node";
import { isTrpcNotFoundError } from "../utils/errors";

export function SadPath({
  className,
  error,
  isLoading = false,
}: {
  className?: string | undefined;
  error?: TRPCClientErrorLike<AppRouter> | undefined | null;
  isLoading?: boolean;
}) {
  return (
    <div className={className}>
      {isTrpcNotFoundError(error ?? undefined) ? (
        <span>Not Found</span>
      ) : isLoading ? (
        <span className="animate-loading-fade-in">Loading...</span>
      ) : (
        <span>Error! {error?.message ?? ""}</span>
      )}
    </div>
  );
}
