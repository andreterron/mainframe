import {
  getDatasetTable,
  getObjectsForDataset,
  getTablesForDataset,
} from "./lib/integrations.ts";
import { isEqual } from "lodash-es";
import {
  IntegrationObject,
  IntegrationTable,
} from "./lib/integration-types.ts";
import {
  datasetsTable,
  objectsTable,
  rowsTable,
  tablesTable,
  Dataset,
} from "@mainframe-so/shared";
import { and, eq } from "drizzle-orm";
import { deserialize, serialize } from "./utils/serialization.ts";
import { writeOperation } from "./lib/operations.ts";
import { type LibSQLDatabase } from "drizzle-orm/libsql";
import { MainframeContext } from "./lib/context.ts";

export async function updateRowFromTableType(
  ctx: MainframeContext,
  dataset: Dataset,
  tableKey: string,
  data: any,
) {
  const table = getDatasetTable(dataset, tableKey);
  if (!table) {
    return;
  }

  // Upsert table
  const [dbTable] = await ctx.db
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

  await updateRow(ctx, data, id, dbTable.id);
}

export async function updateRow(
  ctx: MainframeContext,
  data: any,
  id: string,
  tableId: string,
) {
  const [existing] = await ctx.db
    .select()
    .from(rowsTable)
    .where(and(eq(rowsTable.tableId, tableId), eq(rowsTable.sourceId, id)))
    .limit(1);
  if (existing && isEqual(deserialize(existing.data), data)) {
    return false;
  }
  const [upserted] = await ctx.db
    .insert(rowsTable)
    .values({ tableId, sourceId: id, data: serialize(data) })
    .onConflictDoUpdate({
      target: [rowsTable.tableId, rowsTable.sourceId],
      set: { data: serialize(data), sourceId: id },
    })
    .returning();
  if (upserted) {
    writeOperation(ctx.operations, { type: "row", tableId, data: data });
  }
  return !!upserted;
}

export async function updateObject(
  ctx: MainframeContext,
  dataset: Dataset,
  data: any,
  id: string | null,
  objectType: string,
) {
  const [existing] = await ctx.db
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
  const [upserted] = await ctx.db
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
  if (upserted) {
    writeOperation(ctx.operations, {
      type: "object",
      datasetId: dataset.id,
      objectType,
      data: data,
    });
  }
  return !!upserted;
}

export async function syncObject(
  ctx: MainframeContext,
  dataset: Dataset,
  objectDefinition: IntegrationObject & { id: string },
) {
  if (!objectDefinition.get || !objectDefinition.objId) {
    return;
  }

  // Call fetch for each object definition
  const data = await objectDefinition.get(dataset);

  await updateObject(
    ctx,
    dataset,
    data,
    data ? objectDefinition.objId(dataset, data) : null,
    objectDefinition.id,
  );
}

export async function syncTable(
  ctx: MainframeContext,
  dataset: Dataset,
  table: IntegrationTable & { id: string },
) {
  try {
    if (!table.get) {
      return;
    }

    // Call fetch on each table
    const data = await table.get(dataset, ctx.db);

    // Save the rows on the DB
    if (!Array.isArray(data)) {
      console.error(
        "Data is not an array. type:",
        typeof data,
        "| Dataset id:",
        dataset.id,
      );
      return;
    }

    // Upsert table
    let [dbTable] = await ctx.db
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

      const result = await updateRow(ctx, rowData, id, dbTable.id);
      if (result) {
        updated++;
      }
    }

    await writeOperation(ctx.operations, {
      type: "table",
      datasetId: dataset.id,
      tableId: table.id,
    });
  } catch (e) {
    console.error(e);
  }
}

export async function syncDataset(ctx: MainframeContext, dataset: Dataset) {
  if (
    !dataset.integrationType ||
    (!dataset.credentials?.token && !dataset.credentials?.accessToken)
  ) {
    return;
  }

  // Load all objects
  const objects = getObjectsForDataset(dataset);

  for (let object of objects) {
    await syncObject(ctx, dataset, object);
  }

  // Load all tables
  const tables = getTablesForDataset(dataset);

  for (let table of tables) {
    await syncTable(ctx, dataset, table);
  }
}

export async function syncAll(ctx: MainframeContext) {
  // Load all datasets
  const datasets = await ctx.db.select().from(datasetsTable);

  for (let dataset of datasets) {
    await syncDataset(ctx, dataset);
  }
}
