import { Context, Hono } from "hono";
import { Env } from "./types.ts";
import { ApiRouterHooks, createApiRouter } from "./routers/api-router.ts";
import { webhookRouter } from "./routers/webhook-router.ts";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { oauthRouter } from "./routers/oauth-router.ts";
import { isApiRequestAuthorizedForPasswordAuth } from "./lib/password-based-auth/password-auth-api-check.ts";
import { env } from "./lib/env.server.ts";
import { MainframeContext } from "./lib/context.ts";
import { OperationsEmitter } from "./lib/operations.ts";
import { Client } from "@libsql/client/.";

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
     * @deprecated Please use `getRequestCtx`
     * @param c Hono context. Please don't call response methods.
     * @returns LibSQLDatabase. Required for some endpoints
     */
    getRequestDB?: (
      c: Context<E>,
    ) => Promise<LibSQLDatabase | undefined> | LibSQLDatabase | undefined;

    /**
     * Callback that returns the database variable for this request
     *
     * @param c Hono context. Please don't call response methods.
     * @returns MainframeContext. The `db` property is required for some
     *          endpoints. The `operations` property enables reactive updates
     */
    getRequestCtx: (
      c: Context<E>,
    ) =>
      | Promise<{ db: Client; operations?: OperationsEmitter } | undefined>
      | { db: Client; operations?: OperationsEmitter }
      | undefined;
  } & Partial<ApiRouterHooks>,
) {
  const app = new Hono<E>();

  app.use(async (c, next) => {
    const ctx = await init.getRequestCtx(c);
    const db = ctx?.db ? drizzle(ctx.db) : await init.getRequestDB?.(c);
    c.set("db", db);
    c.set("operations", ctx?.operations);
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
