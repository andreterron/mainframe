import cron from "node-cron";
import closeWithGrace from "close-with-grace";
import { db } from "./db/db.server";
import { getIntegrationForDataset } from "./lib/integrations";
import express, { Express } from "express";
import { json, text } from "body-parser";
import { env } from "./lib/env.server";
import { ZodError } from "zod";
import type { Server } from "http";
import { syncAll } from "./sync";
import { datasetsTable } from "@mainframe-so/shared";
import { eq } from "drizzle-orm";
import { startCloudflared } from "./cloudflared";
import type { ChildProcess } from "node:child_process";
import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { Context, CreateContextHooks, createContext } from "./trpc_context";
import { appRouter } from "./trpc_router";
export type { AppRouter } from "./trpc_router";
import cors from "cors";
import { buildApiRouter, ApiRouterHooks } from "./api";
import { oauthRouter } from "./oauth_router";
import { ip } from "address";
import chalk from "chalk";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { Client } from "@libsql/client";

export interface SetupServerHooks extends CreateContextHooks, ApiRouterHooks {
  express?: (app: Express) => void;
  getDB?: (
    req: express.Request,
  ) => Promise<Client | undefined> | Client | undefined;
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
      // TODO: Iterate over every `db`
      try {
        await syncAll(db);
      } catch (e) {
        console.error(e);
      }
    },
    {
      runOnInit: env.VITE_AUTH_PASS,
      scheduled: env.VITE_AUTH_PASS,
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
    cors({ credentials: true, origin: env.APP_URL }),
    buildApiRouter(hooks),
  );
  app.use("/oauth", oauthRouter);

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
    const localUrl = `http://localhost:${port}`;
    let lanUrl: string | null = null;
    const localIp = ip();
    // Check if the address is a private ip
    // https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
    // https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-dev-utils/WebpackDevServerUtils.js#LL48C9-L54C10
    if (
      localIp &&
      /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(localIp)
    ) {
      lanUrl = `http://${localIp}:${port}`;
    }

    const urls = [`${chalk.bold("Local:")}            ${chalk.cyan(localUrl)}`];

    if (lanUrl) {
      urls.push(`${chalk.bold("On Your Network:")}  ${chalk.cyan(lanUrl)}`);
    }

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

  closeWithGrace(async ({ signal }) => {
    task.stop();
    cloudflaredProcess?.kill(signal);
    if (server) {
      await new Promise<void>((resolve, reject) =>
        server?.close((e) => {
          e ? reject(e) : resolve();
        }),
      );
    }
  });
}
