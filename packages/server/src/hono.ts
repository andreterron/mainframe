import { getRequestListener } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./lib/env.server";

export const hono = new Hono()
  // Healthcheck
  .get("/healthcheck", async (c) => {
    return c.json({ success: true });
  });

export const honoRequestListener = getRequestListener(hono.fetch, {
  hostname: new URL(env.VITE_API_URL).hostname,
});
