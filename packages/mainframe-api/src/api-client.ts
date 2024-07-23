import { hc } from "hono/client";
import type { AppType } from "@mainframe-api/server";

export const createApiClient = (apiURL: string) =>
  hc<AppType>(apiURL, {
    init: { credentials: "include" },
  });

export type MainframeApiClient = ReturnType<typeof createApiClient>;
