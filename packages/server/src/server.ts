import cron from "node-cron";
import closeWithGrace, {
  type CloseWithGraceAsyncCallback,
} from "close-with-grace";
import { db } from "./db/db.server.js";
import { getIntegrationForDataset } from "./lib/integrations.js";
import express, { Express } from "express";
import bodyParser from "body-parser";
import { env } from "./lib/env.server.js";
import { ZodError } from "zod";
import type { Server } from "http";
import { syncAll } from "./sync.js";
import { datasetsTable } from "@mainframe-so/shared";
import { eq } from "drizzle-orm";
import { startCloudflared } from "./cloudflared.js";
import type { ChildProcess } from "node:child_process";
import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { Context, CreateContextHooks, createContext } from "./trpc_context.js";
import { appRouter } from "./trpc_router.js";
export type { AppRouter } from "./trpc_router.js";
import cors from "cors";
import { buildApiRouter, ApiRouterHooks } from "./api.js";
import { oauthRouter } from "./oauth_router.js";
import { ip } from "address";
import chalk from "chalk";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { Client } from "@libsql/client";

const { json, text } = bodyParser;

export interface SetupServerHooks extends CreateContextHooks, ApiRouterHooks {
  express?: (app: Express) => void;
  getDB?: (
    req: express.Request,
  ) => Promise<Client | undefined> | Client | undefined;
  iterateOverDBs?: (
    callback: (db: LibSQLDatabase, userId: string) => Promise<void>,
  ) => Promise<void>;
  closeWithGrace?: CloseWithGraceAsyncCallback;
}

declare global {
  namespace Express {
    interface Request {
      // TODO: This is optional
      db: LibSQLDatabase;
    }
  }
}

export function setupServer(hooks: SetupServerHooks = {}) {
  const t = initTRPC.context<Context>().create();

  const port = env.PORT || 8745;

  async function setupWebhooks(baseApiUrl: string) {
    // Get all datasets
    const datasets = await db.select().from(datasetsTable);

    // For each integration
    for (let dataset of datasets) {
      const integration = getIntegrationForDataset(dataset);
      if (integration?.setupWebhooks) {
        await integration.setupWebhooks(db, dataset, baseApiUrl);
      }
    }
  }

  // Create cron
  const task = cron.schedule(
    "*/10 * * * *",
    async (now) => {
      async function syncDB(db: LibSQLDatabase, userId?: string) {
        try {
          await syncAll(db);
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
        await syncDB(db);
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
    if (hooks.getDB) {
      try {
        const hookDB = await hooks.getDB(req);
        if (hookDB) {
          const client = hookDB;
          req.db = drizzle(client);
        }
      } catch (e) {
        console.log("Failed to use hook to create DB");
        console.error(e);
      }
    } else {
      req.db = db;
    }
    next();
  });

  app.get("/healthcheck", (req, res) => {
    res.json({ success: true });
  });

  process
    .on("unhandledRejection", (reason, p) => {
      console.error(reason, "Unhandled Rejection at Promise", p);
    })
    .on("uncaughtException", (err) => {
      console.error(err, "Uncaught Exception thrown");
    });

  app.all(
    ["/webhooks/:dataset_id", "/webhooks/:dataset_id/*"],
    // Text is used here so integrations can validate the webhook signature
    text({ type: () => true }),
    async (req, res, next) => {
      try {
        console.log(
          `Received webhook request for dataset ${req.params.dataset_id}`,
        );
        // TODO: This req.db might not exist
        const [dataset] = await req.db
          .select()
          .from(datasetsTable)
          .where(eq(datasetsTable.id, req.params.dataset_id))
          .limit(1);
        if (!dataset) {
          res.sendStatus(404);
          return;
        }
        if (!dataset) {
          return res.sendStatus(404);
        }
        const integration = getIntegrationForDataset(dataset);

        if (!integration?.webhook) {
          return res.sendStatus(404);
        }

        integration.webhook(dataset, req, res);
      } catch (e) {
        next(e);
      }
    },
  );

  app.use(
    "/trpc",
    cors({ credentials: true, origin: env.APP_URL }),
    json(),
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: createContext(hooks),
      onError: ({ error, path }) => {
        console.error(path, error);
      },
    }),
  );

  app.use(
    "/api",
    (req, res, next) => {
      cors(
        req.header("Origin") === env.APP_URL
          ? {
              credentials: req.header("Origin") === env.APP_URL,
              origin: env.APP_URL,
            }
          : {},
      )(req, res, next);
    },
    buildApiRouter(hooks),
  );
  app.use("/oauth", oauthRouter);

  // Redirect the root API path to the app
  app.get("/", (req, res) => {
    res.redirect(env.APP_URL);
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

      await setupWebhooks(baseApiUrl);
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
