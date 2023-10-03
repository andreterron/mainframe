import cron from "node-cron";
import closeWithGrace from "close-with-grace";
import { db } from "../app/db/db.server";
import { getIntegrationForDataset } from "../app/lib/integrations";
import express from "express";
import { text } from "body-parser";
import { env } from "../app/lib/env.server";
import { ZodError } from "zod";
import type { Server } from "http";
import { syncAll } from "./sync";
import { datasetsTable } from "../app/db/schema";
import { eq } from "drizzle-orm";
import { startCloudflared } from "./cloudflared";

const port = env.SYNC_PORT;

async function setupIntegrations() {
    // Get all datasets
    const datasets = await db.select().from(datasetsTable);

    // For each integration
    for (let dataset of datasets) {
        const integration = getIntegrationForDataset(dataset);
        if (integration?.setup) {
            await integration.setup(dataset);
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
    server = app
        .listen(port, () => {
            console.log(`Sync server listening on port ${port}`);
        })
        .on("error", function (err) {
            if ((err as any).code === "EADDRINUSE") {
                // port is currently in use
                console.log(`Address in use, retry ${addrInUseRetries++}...`);
                setTimeout(() => {
                    addrInUseTimeout *= 2;
                    startListen();
                }, addrInUseTimeout);
                return;
            }
        });
}

startListen();

startCloudflared();

let addrInUseTimeout = 111;
let addrInUseRetries = 1;

setupIntegrations();

process.on("uncaughtException", (err) => {
    console.error(err);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
});

closeWithGrace(() => {
    server?.close();
    task.stop();
});
