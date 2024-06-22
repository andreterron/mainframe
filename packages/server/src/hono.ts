import { Hono } from "hono";
import { Env } from "./types.ts";
import { apiRouter } from "./routers/api-router.ts";
import { webhookRouter } from "./routers/webhook-router.ts";

export function createHono<E extends Env = Env>(init?: {
  initApp: (app: Hono<E>) => void;
}) {
  const app = new Hono<E>();

  init?.initApp?.(app);

  return app
    .route("/api", apiRouter)
    .route("/webhooks", webhookRouter)
    .get("/healthcheck", async (c) => {
      return c.json({ success: true });
    });
}
