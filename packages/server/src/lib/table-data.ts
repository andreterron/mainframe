import { datasetsTable, rowsTable, tablesTable } from "@mainframe-so/shared";
import { and, eq } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { getDatasetTable } from "./integrations.js";
import { ROW_LIMIT } from "../utils/constants.js";
import { deserializeData } from "../utils/serialization.js";

export async function getTableData(
  datasetId: string | undefined,
  tableId: string | undefined,
  db: LibSQLDatabase<Record<string, never>>,
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
