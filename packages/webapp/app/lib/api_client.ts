import { env } from "../lib/env_client";
import { hc } from "hono/client";
// TODO: Use AppType instead of ConnectAPIType
import type { ConnectAPIType } from "@mainframe-so/server";

export const apiClient = hc<ConnectAPIType>(`${env.VITE_API_URL}/connect`, {
  init: { credentials: "include" },
});
