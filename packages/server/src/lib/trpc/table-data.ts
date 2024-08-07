import { datasetsTable, rowsTable, tablesTable } from "@mainframe-api/shared";
import { and, eq } from "drizzle-orm";
import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { getDatasetTable } from "../integrations.ts";
import { ROW_LIMIT } from "../../utils/constants.ts";
import { deserializeData } from "../../utils/serialization.ts";

export async function getTableData(
  datasetId: string | undefined,
  tableId: string | undefined,
  db: SqliteRemoteDatabase<Record<string, never>>,
) {
  if (!datasetId || !tableId) {
    return undefined;
  }

  const [dataset] = await db
    .select()
    .from(datasetsTable)
    .where(eq(datasetsTable.id, datasetId))
    .limit(1);

  if (!dataset) {
    return undefined;
  }

  const table = getDatasetTable(dataset, tableId);

  if (!table) {
    return undefined;
  }

  // Upsert table
  const tableRows = await db
    .insert(tablesTable)
    .values({
      datasetId: dataset.id,
      name: table.name,
      key: tableId,
    })
    .onConflictDoUpdate({
      target: [tablesTable.datasetId, tablesTable.key],
      set: { key: tableId },
    })
    .returning({
      id: tablesTable.id,
      view: tablesTable.view,
      name: tablesTable.name,
    });

  const rows = await db
    .select({ id: rowsTable.id, data: rowsTable.data })
    .from(rowsTable)
    .innerJoin(tablesTable, eq(tablesTable.id, rowsTable.tableId))
    .where(
      and(eq(tablesTable.datasetId, datasetId), eq(tablesTable.key, tableId)),
    )
    .limit(ROW_LIMIT);

  return {
    dataset,
    rows: rows.map(deserializeData),
    table: tableRows.at(0),
  };
}
