import {
    getDatasetTable,
    getObjectsForDataset,
    getTablesForDataset,
} from "../app/lib/integrations";
import { Dataset } from "../app/lib/types";
import { isEqual } from "lodash";
import {
    IntegrationObject,
    IntegrationTable,
} from "../app/lib/integration-types";
import {
    datasetsTable,
    objectsTable,
    rowsTable,
    tablesTable,
} from "../app/db/schema";
import { db } from "../app/db/db.server";
import { and, eq } from "drizzle-orm";
import { deserialize, serialize } from "../app/utils/serialization";

export async function updateRowFromTableType(
    dataset: Dataset,
    tableKey: string,
    data: any,
) {
    const table = getDatasetTable(dataset, tableKey);
    if (!table) {
        return;
    }

    // Upsert table
    const [dbTable] = await db
        .insert(tablesTable)
        .values({ datasetId: dataset.id, name: table.name, key: table.id })
        .onConflictDoUpdate({
            target: [tablesTable.datasetId, tablesTable.key],
            set: { name: table.name },
        })
        .returning();

    if (!table.rowId || !dbTable) {
        console.log("Find the id", data);
        return;
    }

    const id = table.rowId(dataset, data);

    await updateRow(data, id, dbTable.id);
}

export async function updateRow(data: any, id: string, tableId: string) {
    const [existing] = await db
        .select()
        .from(rowsTable)
        .where(and(eq(rowsTable.tableId, tableId), eq(rowsTable.sourceId, id)))
        .limit(1);
    if (existing && isEqual(deserialize(existing.data), data)) {
        return false;
    }
    const [upserted] = await db
        .insert(rowsTable)
        .values({ tableId, sourceId: id, data: serialize(data) })
        .onConflictDoUpdate({
            target: [rowsTable.tableId, rowsTable.sourceId],
            set: { data: serialize(data), sourceId: id },
        })
        .returning();
    return !!upserted;
}

export async function updateObject(
    dataset: Dataset,
    data: any,
    id: string | null,
    objectType: string,
) {
    const [existing] = await db
        .select()
        .from(objectsTable)
        .where(
            and(
                eq(objectsTable.objectType, objectType),
                eq(objectsTable.datasetId, dataset.id),
            ),
        )
        .limit(1);
    if (existing && isEqual(deserialize(existing.data), data)) {
        return false;
    }
    const [upserted] = await db
        .insert(objectsTable)
        .values({
            objectType: objectType,
            // Do we need sourceId here?
            sourceId: id,
            data: serialize(data),
            datasetId: dataset.id,
        })
        .onConflictDoUpdate({
            target: [objectsTable.objectType, objectsTable.datasetId],
            set: { data: serialize(data), sourceId: id },
        })
        .returning();
    return !!upserted;
}

export async function syncObject(
    dataset: Dataset,
    objectDefinition: IntegrationObject & { id: string },
) {
    console.log("Syncing");
    if (!objectDefinition.get || !objectDefinition.objId) {
        return;
    }

    console.log(
        `Loading data for object ${objectDefinition.name} from ${dataset.name}`,
    );

    // Call fetch for each object definition
    const data = await objectDefinition.get(dataset);

    await updateObject(
        dataset,
        data,
        data ? objectDefinition.objId(dataset, data) : null,
        objectDefinition.id,
    );
}

export async function syncTable(
    dataset: Dataset,
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

    // Upsert table
    let [dbTable] = await db
        .insert(tablesTable)
        .values({ datasetId: dataset.id, name: table.name, key: table.id })
        .onConflictDoUpdate({
            target: [tablesTable.datasetId, tablesTable.key],
            set: { name: table.name },
        })
        .returning();

    if (!table.rowId || !dbTable) {
        console.log("Find the id", data[0]);
        return;
    }

    let updated = 0;

    for (let rowData of data) {
        const id = table.rowId(dataset, rowData);

        const result = await updateRow(rowData, id, dbTable.id);
        if (result) {
            updated++;
        }
    }

    console.log(`Updated ${updated} rows`);
}

export async function syncDataset(dataset: Dataset) {
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
    const datasets = await db.select().from(datasetsTable);

    for (let dataset of datasets) {
        await syncDataset(dataset);
    }
}
