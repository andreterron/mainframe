import { getRequestListener, type HttpBindings } from "@hono/node-server";
import { type ServerResponse } from "http";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { env } from "./lib/env.server";
import { Env } from "./hono/hono-types";
import { apiRouter } from "./routes/api";

const dbMiddleware = createMiddleware<Env>(async (c, next) => {
  c.set("db", c.env.incoming.db);
  await next();
});

export const hono = new Hono<Env>()
  // Healthcheck
  .use(dbMiddleware)
  .route("/api", apiRouter)
  .get("/healthcheck", async (c) => {
    return c.json({ success: true });
  });

export const honoRequestListener = getRequestListener(hono.fetch, {
  hostname: new URL(env.VITE_API_URL).hostname,
});
