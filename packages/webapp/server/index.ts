import cron from "node-cron";
import closeWithGrace from "close-with-grace";
import { db } from "../app/lib/db";
import {
    getDatasetObject,
    getDatasetTable,
    getIntegrationForDataset,
} from "../app/lib/integrations";
import { Dataset } from "../app/lib/types";
import express from "express";
import { json, text } from "body-parser";
import { env } from "../app/lib/env";
import { ZodError, z } from "zod";
import { nanoid } from "nanoid";
import PouchDB from "pouchdb";
import cors from "cors";
import type { Server } from "http";
import { ADMIN_ROLE, ensureAdminRole } from "./admin-role";
import { syncDataset, syncAll, syncObject, syncTable } from "./sync";

const port = env.SYNC_PORT;

async function setupIntegrations() {
    // Get all datasets
    const datasets = (await db.find({
        selector: {
            type: "dataset",
        },
    })) as PouchDB.Find.FindResponse<Dataset>;

    if (datasets.warning) {
        console.warn(datasets.warning);
    }

    // For each integration
    for (let dataset of datasets.docs) {
        const integration = getIntegrationForDataset(dataset);
        if (integration?.setup) {
            await integration.setup(dataset);
        }
    }
}

// Sync datasets whenever they are created or updated
const dbChangesSubscription = db
    .changes({
        since: "now",
        live: true,
        include_docs: true,
        selector: { type: "dataset" },
    })
    .on("change", (change) => {
        if (change.doc?.type === "dataset") {
            syncDataset(change.doc).catch((e) => console.error(e));
        }
    })
    .on("error", (error) => {
        console.error(error);
    });

async function createIndexes() {
    db.createIndex({
        index: {
            fields: ["type"],
        },
    });
    db.createIndex({
        index: {
            fields: ["type", "datasetId", "table"],
        },
    });
    db.createIndex({
        index: {
            fields: ["type", "datasetId", "objectType"],
        },
    });
}

createIndexes().catch((e) => console.error(e));

// Create cron
const task = cron.schedule(
    "*/10 * * * *",
    async (now) => {
        try {
            // TODO: Ensure index exists
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

app.use("/sync", json());

app.post("/sync", async (_, res, next) => {
    try {
        await syncAll();
        res.send({ result: "success" });
    } catch (e) {
        next(e);
    }
});

app.post("/sync/dataset/:datasetId", async (req, res, next) => {
    try {
        const { datasetId } = req.params;
        const dataset = await db.get(datasetId);
        if (dataset.type !== "dataset") {
            res.sendStatus(404);
            return;
        }

        await syncDataset(dataset);
        res.send({ result: "success" });
    } catch (e) {
        next(e);
    }
});

app.post(
    "/sync/dataset/:datasetId/object/:objectId",
    async (req, res, next) => {
        try {
            const { datasetId, objectId } = req.params;
            const dataset = await db.get(datasetId);
            if (dataset.type !== "dataset") {
                res.sendStatus(404);
                return;
            }

            const object = getDatasetObject(dataset, objectId);

            if (!object) {
                res.sendStatus(404);
                return;
            }

            await syncObject(dataset, object);
            res.send({ result: "success" });
        } catch (e) {
            next(e);
        }
    },
);

app.post("/sync/dataset/:datasetId/table/:tableId", async (req, res, next) => {
    try {
        const { datasetId, tableId } = req.params;
        const dataset = await db.get(datasetId);
        if (dataset.type !== "dataset") {
            res.sendStatus(404);
            return;
        }

        const table = getDatasetTable(dataset, tableId);

        if (!table) {
            res.sendStatus(404);
            return;
        }

        await syncTable(dataset, table);
        res.send({ result: "success" });
    } catch (e) {
        next(e);
    }
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

let generatedAuthCode: string | null;
let creatingUserLock = false;

const zAuthCodeBody = z.object({
    token: z.string(),
    username: z.string(),
    password: z.string(),
});

// TODO: Review db URL
const usersDb = new PouchDB("http://localhost:5984/_users", {
    auth: {
        username: env.COUCHDB_USER,
        password: env.COUCHDB_PASSWORD,
    },
});

async function printAuthURL() {
    try {
        const users = await usersDb.find({
            selector: {},
            limit: 100,
        });

        // Stop if we already have users
        if (users.docs.length) {
            return;
        }

        generatedAuthCode = nanoid(32);

        // TODO: Review these logs, ensure Remix doesn't paste their URL as well.
        console.log("\n\nTOKEN:", generatedAuthCode);
        console.log(
            "\n\nURL (local):",
            `http://localhost:${env.PORT}/setup?token=${generatedAuthCode}`,
        );
        console.log("\n\n");
    } catch (e) {
        console.error(e);
    }
}

ensureAdminRole();

app.use("/auth/create", cors());
app.post("/auth/create", json(), async (req, res, next) => {
    try {
        if (creatingUserLock) {
            // HACK: Avoid creating 2 users when in React strict mode
            return res.sendStatus(400);
        }
        creatingUserLock = true;

        const users = await usersDb.find({
            selector: {},
        });

        if (generatedAuthCode === null || users.docs.length) {
            // Forbidden - We don't have a generated auth code
            return res.sendStatus(403);
        }

        const { token, username, password } = zAuthCodeBody.parse(req.body);

        if (!username || !password) {
            return res.sendStatus(400);
        }
        if (token !== generatedAuthCode) {
            return res.sendStatus(401);
        }

        // Create user
        await usersDb.put({
            _id: `org.couchdb.user:${username}`,
            name: username,
            type: "user",
            roles: [ADMIN_ROLE],
            password,
        });

        creatingUserLock = false;

        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

app.all(
    ["/webhooks/:dataset_id", "/webhooks/:dataset_id/*"],
    // Text is used here so integrations can validate the webhook signature
    text({ type: () => true }),
    async (req, res, next) => {
        try {
            let dataset: (Dataset & { _id: string }) | undefined;
            try {
                dataset = await db.get(req.params.dataset_id);
            } catch (getError) {
                return res.sendStatus(404);
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
            printAuthURL().catch((e) => console.error(e));
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
    dbChangesSubscription.cancel();
});
