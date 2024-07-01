import cron from "node-cron";
import closeWithGrace, {
  type CloseWithGraceAsyncCallback,
} from "close-with-grace";
import { dbClient } from "./db/db.server.ts";
import {
  MainframeContext,
  getIntegrationForDataset,
  GLOBAL_operations,
  OperationsEmitter,
} from "@mainframe-so/server";
import express, { Express } from "express";
import bodyParser from "body-parser";
import { env } from "./lib/env.server.ts";
import { ZodError } from "zod";
import type { Server } from "node:http";
import { syncAll, ApiRouterHooks } from "@mainframe-so/server";
import { datasetsTable } from "@mainframe-so/shared";
import { startCloudflared } from "./cloudflared.ts";
import type { ChildProcess } from "node:child_process";
import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { Context, CreateContextHooks, createContext } from "./trpc_context.ts";
import { appRouter } from "./trpc_router.ts";
export type { AppRouter } from "./trpc_router.ts";
import cors from "cors";
import chalk from "chalk";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { Client } from "@libsql/client";
import { createHonoRequestListener } from "./hono.ts";

export interface SetupServerHooks
  extends CreateContextHooks,
    Partial<ApiRouterHooks> {
  express?: (app: Express) => void;
  getCtx?: (
    req: express.Request,
  ) =>
    | Promise<{ db: Client; operations?: OperationsEmitter } | undefined>
    | { db: Client; operations?: OperationsEmitter }
    | undefined;
  iterateOverDBs?: (
    callback: (ctx: MainframeContext, userId: string) => Promise<void>,
  ) => Promise<void>;
  closeWithGrace?: CloseWithGraceAsyncCallback;
}

declare global {
  namespace Express {
    interface Request {
      // TODO: This is optional
      db: Client;
      operations?: OperationsEmitter;
    }
  }
}

export function setupServer(hooks: SetupServerHooks = {}) {
  // TODO: Try to remove this
  const localDb = drizzle(dbClient);

  const honoRequestListener = createHonoRequestListener(hooks);

  const port = env.PORT || 8745;

  async function setupWebhooks(baseApiUrl: string, ctx: MainframeContext) {
    // Get all datasets
    const datasets = await ctx.db.select().from(datasetsTable);

    // For each integration
    for (let dataset of datasets) {
      const integration = getIntegrationForDataset(dataset);
      if (integration?.setupWebhooks) {
        await integration.setupWebhooks(ctx, dataset, baseApiUrl);
      }
    }
  }

  // Create cron
  const task = cron.schedule(
    "*/10 * * * *",
    async (now) => {
      async function syncDB(ctx: MainframeContext, userId?: string) {
        try {
          await syncAll(ctx);
        } catch (e) {
          if (userId) {
            console.error("Failed to sync User's DB", userId);
          }
          console.error(e);
        }
      }

      if (hooks.iterateOverDBs) {
        await hooks.iterateOverDBs(syncDB);
      } else {
        await syncDB({ db: localDb, operations: GLOBAL_operations });
      }
    },
    {
      runOnInit: true,
      scheduled: true,
    },
  );

  const app = express();

  hooks.express?.(app);

  app.use(async (req, _res, next) => {
    if (hooks.getCtx) {
      try {
        const hookCtx = await hooks.getCtx(req);
        if (hookCtx) {
          req.db = hookCtx.db;
          req.operations = hookCtx.operations;
        }
      } catch (e) {
        console.log("Failed to use hook to create DB");
        console.error(e);
      }
    } else {
      req.db = dbClient;
      req.operations = GLOBAL_operations;
    }
    next();
  });

  process
    .on("unhandledRejection", (reason, p) => {
      console.error(reason, "Unhandled Rejection at Promise", p);
    })
    .on("uncaughtException", (err) => {
      console.error(err, "Uncaught Exception thrown");
    });

  app.use(
    "/trpc",
    cors({ credentials: true, origin: env.APP_URL }),
    bodyParser.json(),
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: createContext(hooks),
      onError: ({ error, path }) => {
        console.error(path, error);
      },
    }),
  );

  // Redirect the root API path to the app
  app.get("/", (req, res) => {
    res.redirect(env.APP_URL);
  });

  app.use(async (req, res, next) => {
    try {
      await honoRequestListener(req, res);
    } catch (e) {
      next(e);
    }
  });

  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (err) {
        console.error(err);
        if (err instanceof ZodError) {
          return res.sendStatus(400);
        }
        res.sendStatus(500);
      }
    },
  );

  let server: Server | undefined;

  function printSuccess(port: number) {
    console.log(`\n 🎉  Your Mainframe is up!`);

    const urls = [
      `${chalk.bold("Local:")}            ${chalk.cyan(env.APP_URL)}`,
    ];

    if (env.TUNNEL_BASE_API_URL) {
      urls.push(
        `${chalk.bold("On The Internet:")}   ${chalk.cyan(
          env.TUNNEL_BASE_API_URL,
        )}`,
      );
    }

    const urlLines = urls
      .map((line, i, a) => `${i === a.length - 1 ? ` └─  ` : ` ├─  `}${line}`)
      .join("\n");

    console.log(`\n${urlLines}\n`);

    console.log(`${chalk.bold("Press Ctrl+C to stop")}\n`);
  }

  function startListen() {
    return new Promise<void>((resolve, reject) => {
      server = app
        .listen(port, () => {
          printSuccess(port);
          resolve();
        })
        .on("error", function (err) {
          if ((err as any).code === "EADDRINUSE") {
            // port is currently in use
            console.log(`Address in use, retry ${addrInUseRetries++}...`);
            setTimeout(() => {
              addrInUseTimeout *= 2;
              startListen().then(resolve, reject);
            }, addrInUseTimeout);
            return;
          }
        });
    });
  }

  const serverPromise = startListen();

  let cloudflaredProcess: ChildProcess | undefined;

  startCloudflared()
    .then(async (args) => {
      if (!args) {
        return;
      }
      const { child, url, connections } = args;
      cloudflaredProcess = child;

      const baseApiUrl = env.TUNNEL_BASE_API_URL;

      // Ensure tunnel is connected before setting up webhooks
      await Promise.all(connections);

      // Wait for the API to be ready
      await serverPromise;

      if (hooks.iterateOverDBs) {
        await hooks.iterateOverDBs(async (ctx, userId) => {
          try {
            await setupWebhooks(baseApiUrl, ctx);
          } catch (e) {
            console.error(`Failed to setup webhook for user ${userId}`);
            console.error(e);
          }
        });
      } else {
        await setupWebhooks(baseApiUrl, {
          db: localDb,
          operations: GLOBAL_operations,
        });
      }
    })
    .catch((e) => console.error(e));

  let addrInUseTimeout = 100;
  let addrInUseRetries = 1;

  process.on("uncaughtException", (err) => {
    console.error(err);
    process.exit(1);
  });

  process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
  });

  closeWithGrace(async (options) => {
    task.stop();
    cloudflaredProcess?.kill(options.signal);
    const closeServerPromise = server
      ? new Promise<void>((resolve, reject) =>
          server?.close((e) => {
            e ? reject(e) : resolve();
          }),
        )
      : undefined;
    await Promise.all([closeServerPromise, hooks.closeWithGrace?.(options)]);
  });
}
