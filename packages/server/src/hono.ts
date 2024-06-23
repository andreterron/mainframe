import { Context, Hono } from "hono";
import { Env } from "./types.ts";
import { apiRouter } from "./routers/api-router.ts";
import { webhookRouter } from "./routers/webhook-router.ts";
import { LibSQLDatabase } from "drizzle-orm/libsql/driver";

export function createMainframeAPI<E extends Env = Env>(init: {
  /**
   * Callback that can be used to add middleware or extra endpoints
   * to the API
   * @param app Hono app
   */
  initHonoApp?: (app: Hono<E>) => void;

  /**
   * Callback that returns the database variable for this request
   *
   * @param c Hono context. Please don't call response methods.
   * @returns LibSQLDatabase. Required for some endpoints
   */
  getRequestDB: (
    c: Context<E>,
  ) => Promise<LibSQLDatabase | undefined> | LibSQLDatabase | undefined;
}) {
  const app = new Hono<E>();

  app.use(async (c, next) => {
    c.set("db", await init.getRequestDB(c));
    await next();
  });

  init.initHonoApp?.(app);

  return app
    .route("/api", apiRouter)
    .route("/webhooks", webhookRouter)
    .get("/healthcheck", async (c) => {
      return c.json({ success: true });
    });
}
