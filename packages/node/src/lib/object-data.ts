import { and, eq } from "drizzle-orm";
import { deserializeData } from "../utils/serialization";
import { getDatasetObject } from "@mainframe-so/server";
import { datasetsTable, objectsTable } from "@mainframe-so/shared";
import { LibSQLDatabase } from "drizzle-orm/libsql";

export async function getObjectAndDataset(
  datasetId: string | undefined,
  objectType: string | undefined,
  db: LibSQLDatabase<Record<string, never>>,
) {
  if (!datasetId || !objectType) {
    return undefined;
  }

  let [[dataset], [object]] = await Promise.all([
    db
      .select()
      .from(datasetsTable)
      .where(eq(datasetsTable.id, datasetId))
      .limit(1),
    db
      .select()
      .from(objectsTable)
      .where(
        and(
          eq(objectsTable.objectType, objectType),
          eq(objectsTable.datasetId, datasetId),
        ),
      )
      .limit(1),
  ]);

  if (!dataset) {
    return undefined;
  }

  const objectDefinition = getDatasetObject(dataset, objectType);

  if (!object) {
    [object] = await db
      .select()
      .from(objectsTable)
      .where(
        and(
          eq(objectsTable.objectType, objectType),
          eq(objectsTable.datasetId, datasetId),
        ),
      )
      .limit(1);
    console.log("after another select for some reason");
  }

  if (!object) {
    return undefined;
  }

  return {
    object: {
      ...deserializeData(object),
      name: objectDefinition?.name || object.objectType,
    },
    dataset,
  };
}
