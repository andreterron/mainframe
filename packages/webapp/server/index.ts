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
import { env } from "../app/lib/env";

console.log("Server is up!");

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
    if (!table.get || !table.rowId) {
        return;
    }

    console.log(`Loading data for table ${table.name} from ${dataset.name}`);

    // Call fetch on each table
    const data = await table.get(dataset);

    // Save the rows on the DB
    if (!Array.isArray(data)) {
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
        // TODO: Ensure index exists
        await syncAll();
    },
    {
        runOnInit: true,
    },
);

const app = express();

app.post("/sync", async (_, res) => {
    await syncAll();
    res.send({ result: "success" });
});

app.post("/sync/dataset/:datasetId", async (req, res) => {
    const { datasetId } = req.params;
    const dataset = await db.get(datasetId);
    if (dataset.type !== "dataset") {
        res.sendStatus(404);
        return;
    }

    await syncDataset(dataset);
    res.send({ result: "success" });
});

app.post("/sync/dataset/:datasetId/object/:objectId", async (req, res) => {
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
});

app.post("/sync/dataset/:datasetId/table/:tableId", async (req, res) => {
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
});

const port = env.SYNC_PORT;

app.listen(port, () => {
    console.log(`Sync server listening on port ${port}`);
});

closeWithGrace(() => {
    task.stop();
    dbChangesSubscription.cancel();
});
