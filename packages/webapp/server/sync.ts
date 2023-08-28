import { db } from "../app/lib/db";
import {
    getObjectsForDataset,
    getTablesForDataset,
} from "../app/lib/integrations";
import { Dataset } from "../app/lib/types";
import { isEqual } from "lodash";
import {
    IntegrationObject,
    IntegrationTable,
} from "../app/lib/integration-types";

export async function updateObject(
    dataset: Dataset & { _id: string },
    data: any,
    id: string,
    metadata:
        | { type: "object"; objectType: string }
        | { type: "row"; table: string },
) {
    try {
        const obj = await db.get(id);

        if (
            (obj.type === "object" || obj.type === "row") &&
            isEqual(obj.data, data) &&
            obj.datasetId
        ) {
            return false;
        }

        await db.put({
            ...obj,
            data: data,
            datasetId: dataset._id,
            ...metadata,
        });
        return true;
    } catch (e: any) {
        if (e.error === "not_found") {
            await db.put({
                _id: id,
                data: data,
                datasetId: dataset._id,
                ...metadata,
            });
            return true;
        }
    }
    return false;
}

export async function syncObject(
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

    await updateObject(dataset, data, objectDefinition.objId(dataset, data), {
        type: "object",
        objectType: objectDefinition.id,
    });
}

export async function syncTable(
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

        const result = await updateObject(dataset, rowData, id, {
            type: "row",
            table: table.id,
        });
        if (result) {
            updated++;
        }
    }

    console.log(`Updated ${updated} rows`);
}

export async function syncDataset(dataset: Dataset & { _id: string }) {
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

export async function syncAll() {
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
