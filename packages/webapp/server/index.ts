import cron from "node-cron";
import closeWithGrace from "close-with-grace";
import { db } from "../app/lib/db";
import {
    getDatasetObject,
    getDatasetTable,
    getObjectsForDataset,
    getTablesForDataset,
} from "../app/lib/integrations";
import { Dataset } from "../app/lib/types";
import { isEqual } from "lodash";
import express from "express";
import {
    IntegrationObject,
    IntegrationTable,
} from "../app/lib/integration-types";
import { json } from "body-parser";
import { env } from "../app/lib/env";
import { ZodError, z } from "zod";
import { nanoid } from "nanoid";
import PouchDB from "pouchdb";
import cors from "cors";
import type { Server } from "http";
import { ADMIN_ROLE, ensureAdminRole } from "./admin-role";

const port = env.SYNC_PORT;

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

async function syncObject(
    dataset: Dataset & { _id: string },
    objectDefinition: IntegrationObject & { id: string },
) {
    if (!objectDefinition.get || !objectDefinition.objId) {
        return;
    }

    console.log(
        `Loading data for object ${objectDefinition.name} from ${dataset.name}`,
    );

    // Call fetch for each object definition
    const data = await objectDefinition.get(dataset);

    // Save object to the DB
    const id = objectDefinition.objId(dataset, data);

    try {
        const obj = await db.get(id);

        if (obj.type === "object" && isEqual(obj.data, data) && obj.datasetId) {
            return;
        }

        await db.put({
            ...obj,
            data: data,
            objectType: objectDefinition.id,
            datasetId: dataset._id,
        });
    } catch (e: any) {
        if (e.error === "not_found") {
            await db.put({
                _id: id,
                type: "object",
                data: data,
                objectType: objectDefinition.id,
                datasetId: dataset._id,
            });
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

async function syncTable(
    dataset: Dataset & { _id: string },
    table: IntegrationTable & { id: string },
) {
    if (!table.get) {
        return;
    }

    console.log(`Loading data for table ${table.name} from ${dataset.name}`);

    // Call fetch on each table
    const data = await table.get(dataset);

    // Save the rows on the DB
    if (!Array.isArray(data)) {
        console.error("Data is not an array");
        return;
    }

    if (!table.rowId) {
        console.log("Find the id", data[0]);
        return;
    }

    let updated = 0;

    for (let rowData of data) {
        const id = table.rowId(dataset, rowData);

        try {
            const row = await db.get(id);

            if (
                row.type === "row" &&
                isEqual(row.data, rowData) &&
                row.datasetId
            ) {
                continue;
            }

            updated++;

            await db.put({
                ...row,
                data: rowData,
                table: table.id,
                datasetId: dataset._id,
            });
        } catch (e: any) {
            if (e.error === "not_found") {
                updated++;
                await db.put({
                    _id: id,
                    type: "row",
                    data: rowData,
                    table: table.id,
                    datasetId: dataset._id,
                });
            }
        }
    }

    console.log(`Updated ${updated} rows`);
}

async function syncDataset(dataset: Dataset & { _id: string }) {
    if (!dataset.integrationType || !dataset.token) {
        return;
    }

    // Load all objects
    const objects = getObjectsForDataset(dataset);

    for (let object of objects) {
        await syncObject(dataset, object);
    }

    // Load all tables
    const tables = getTablesForDataset(dataset);

    for (let table of tables) {
        await syncTable(dataset, table);
    }
}

async function syncAll() {
    // Load all datasets
    const datasets = (await db.find({
        selector: {
            type: "dataset",
        },
    })) as PouchDB.Find.FindResponse<Dataset>;

    if (datasets.warning) {
        console.warn(datasets.warning);
    }

    for (let dataset of datasets.docs) {
        await syncDataset(dataset);
    }
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

app.use(json());

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
app.post("/auth/create", async (req, res, next) => {
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
