import cron from "node-cron";
import closeWithGrace, {
  type CloseWithGraceAsyncCallback,
} from "close-with-grace";
import { dbClient } from "./db/db.server.ts";
import {
  MainframeContext,
  getIntegrationForDataset,
  MainframeAPIOptions,
} from "@mainframe-api/server";
import express, { Express } from "express";
import { env } from "./lib/env.server.ts";
import { ZodError } from "zod";
import type { Server } from "node:http";
import { syncAll } from "@mainframe-api/server";
import { datasetsTable } from "@mainframe-api/shared";
import { startCloudflared } from "./cloudflared.ts";
import type { ChildProcess } from "node:child_process";
import chalk from "chalk";
import { drizzle } from "drizzle-orm/libsql";
import { Env, createHonoRequestListener } from "./hono.ts";
import { GLOBAL_operations } from "./lib/operations.ts";

export interface SetupServerHooks extends MainframeAPIOptions<Env> {
  express?: (app: Express) => void;
  iterateOverDBs?: (
    callback: (ctx: MainframeContext) => Promise<void>,
  ) => Promise<void>;
  closeWithGrace?: CloseWithGraceAsyncCallback;
}

export function setupServer(hooks: SetupServerHooks) {
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
      async function syncDB(ctx: MainframeContext) {
        try {
          await syncAll(ctx);
        } catch (e) {
          if (ctx.userId) {
            console.error("Failed to sync User's DB", ctx.userId);
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

  process
    .on("unhandledRejection", (reason, p) => {
      console.error(reason, "Unhandled Rejection at Promise", p);
    })
    .on("uncaughtException", (err) => {
      console.error(err, "Uncaught Exception thrown");
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
        await hooks.iterateOverDBs(async (ctx) => {
          try {
            await setupWebhooks(baseApiUrl, ctx);
          } catch (e) {
            console.error(
              `Failed to setup webhook for user ${ctx.userId ?? "(NO_ID)"}`,
            );
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
