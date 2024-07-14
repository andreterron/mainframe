import { Context, Hono } from "hono";
import { Env } from "./types.ts";
import { ApiRouterHooks, createApiRouter } from "./routers/api-router.ts";
import { webhookRouter } from "./routers/webhook-router.ts";
import { oauthRouter } from "./routers/oauth-router.ts";
import { isApiRequestAuthorizedForPasswordAuth } from "./lib/password-based-auth/password-auth-api-check.ts";
import { env } from "./lib/env.server.ts";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./lib/trpc/trpc_router.ts";
import { CreateContextHooks, createContext } from "./lib/trpc/trpc_context.ts";
import { cors } from "hono/cors";
import { connectRouter } from "./routers/connect-router.ts";
import { MainframeContext } from "./lib/context.ts";

export type MainframeAPIOptions<E extends Env = Env> = {
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
   * @returns MainframeContext. The `db` property is required for some
   *          endpoints. The `operations` property enables reactive updates
   */
  getRequestCtx: (
    c: Context<E>,
  ) => Promise<MainframeContext | undefined> | MainframeContext | undefined;
} & Partial<ApiRouterHooks> &
  CreateContextHooks<E>;

export function createMainframeAPI<E extends Env = Env>(
  init: MainframeAPIOptions<E>,
) {
  const app = new Hono<E>();

  app.use(async (c, next) => {
    const ctx = await init.getRequestCtx(c);
    const db = ctx?.db;
    c.set("db", db);
    c.set("operations", ctx?.operations);
    c.set("userId", ctx?.userId);
    await next();
  });

  init.initHonoApp?.(app);

  return (
    app
      .route(
        "/api",
        createApiRouter({
          isApiRequestAuthorized:
            init.isApiRequestAuthorized ??
            isApiRequestAuthorizedForPasswordAuth,
        }),
      )
      .route("/oauth", oauthRouter)
      .route("/webhooks", webhookRouter)
      .use(
        "/trpc/*",
        cors({ credentials: true, origin: env.APP_URL }),
        trpcServer({
          router: appRouter,
          createContext: createContext(init),
          onError: ({ error, path }) => {
            console.error(path, error);
          },
        }),
      )
      .route("/connect", connectRouter)
      .get("/healthcheck", async (c) => {
        return c.json({ success: true });
      })
      // Redirect the root API path to the app
      .get("/", (c) => {
        return c.redirect(env.APP_URL);
      })
  );
}

export type AppType = ReturnType<typeof createMainframeAPI<Env>>;
