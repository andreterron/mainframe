import cron from "node-cron";
import closeWithGrace from "close-with-grace";
import { db } from "./db/db.server";
import { getIntegrationForDataset } from "./lib/integrations";
import express from "express";
import { text } from "body-parser";
import { env } from "./lib/env.server";
import { ZodError } from "zod";
import type { Server } from "http";
import { syncAll } from "./sync";
import { datasetsTable } from "../app/db/schema";
import { eq } from "drizzle-orm";
import { startCloudflared } from "./cloudflared";
import type { ChildProcess } from "node:child_process";
import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { Context, createContext } from "./trpc_context";
import { appRouter } from "./trpc_router";
import cors from "cors";
import ViteExpress from "vite-express";
import { apiRouter } from "./api";
import { oauthRouter } from "./oauth_router";

const t = initTRPC.context<Context>().create();

const port = env.PORT;

async function setupWebhooks(baseApiUrl: string) {
    // Get all datasets
    const datasets = await db.select().from(datasetsTable);

    // For each integration
    for (let dataset of datasets) {
        const integration = getIntegrationForDataset(dataset);
        if (integration?.setupWebhooks) {
            await integration.setupWebhooks(dataset, baseApiUrl);
        }
    }
}

// Create cron
const task = cron.schedule(
    "*/10 * * * *",
    async (now) => {
        try {
            await syncAll();
        } catch (e) {
            console.error(e);
        }
    },
    {
        runOnInit: true,
    },
);

const app = express();

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
            const [dataset] = await db
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
    cors(),
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
    }),
);

app.use("/api", apiRouter);
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

function startListen() {
    return new Promise<void>((resolve, reject) => {
        server = ViteExpress.listen(app, port, () => {
            console.log(`Sync server listening on port ${port}`);
            resolve();
        }).on("error", function (err) {
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
