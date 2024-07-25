import { hc, ClientRequestOptions } from "hono/client";
import type { AppType } from "@mainframe-api/server";

export const createApiClient = (
  apiURL: string,
  options?: ClientRequestOptions,
) =>
  hc<AppType>(apiURL, {
    ...options,
    init: {
      ...options?.init,
      credentials: "include",
    },
  });

export type MainframeApiClient = ReturnType<typeof createApiClient>;
