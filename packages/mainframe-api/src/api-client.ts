import { hc } from "hono/client";
// TODO: Use AppType instead of ConnectAPIType
import type { ConnectAPIType } from "@mainframe-api/server";

export const createApiClient = (apiURL: string) =>
  hc<ConnectAPIType>(`${apiURL}/connect`, {
    init: { credentials: "include" },
  });
