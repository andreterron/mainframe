import { Context, Hono } from "hono";
import { Env } from "./types.ts";
import { ApiRouterHooks, createApiRouter } from "./routers/api-router.ts";
import { webhookRouter } from "./routers/webhook-router.ts";
import { type LibSQLDatabase } from "drizzle-orm/libsql";
import { oauthRouter } from "./routers/oauth-router.ts";
import { isApiRequestAuthorizedForPasswordAuth } from "./lib/password-based-auth/password-auth-api-check.ts";

export function createMainframeAPI<E extends Env = Env>(
  init: {
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
  } & Partial<ApiRouterHooks>,
) {
  const app = new Hono<E>();

  app.use(async (c, next) => {
    c.set("db", await init.getRequestDB(c));
    await next();
  });

  init.initHonoApp?.(app);

  return app
    .route(
      "/api",
      createApiRouter({
        isApiRequestAuthorized:
          init.isApiRequestAuthorized ?? isApiRequestAuthorizedForPasswordAuth,
      }),
    )
    .route("/oauth", oauthRouter)
    .route("/webhooks", webhookRouter)
    .get("/healthcheck", async (c) => {
      return c.json({ success: true });
    });
}
