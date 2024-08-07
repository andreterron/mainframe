import { deserialize } from "../../utils/serialization.ts";
import { Integration } from "../integration-types.ts";
import { Dataset } from "@mainframe-api/shared";
import { rowsTable, tablesTable } from "@mainframe-api/shared";
import { and, eq } from "drizzle-orm";
import { type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";

async function getProjectChildren(
  db: SqliteRemoteDatabase,
  dataset: Dataset,
  urlPath: string,
) {
  try {
    const rows = await db
      .select({
        id: rowsTable.id,
        sourceId: rowsTable.sourceId,
        tableId: rowsTable.tableId,
        data: rowsTable.data,
      })
      .from(rowsTable)
      .innerJoin(tablesTable, eq(tablesTable.id, rowsTable.tableId))
      .where(
        and(
          eq(tablesTable.datasetId, dataset.id),
          eq(tablesTable.key, "projects"),
        ),
      );
    const projectIds: string[] = rows.map((row) => deserialize(row.data).id);
    const projectItems = await Promise.all(
      projectIds.map(async (id): Promise<any[]> => {
        if (!dataset.credentials?.token) return [];
        const res = await fetch(
          `https://app.posthog.com/api/projects/${id}/${urlPath}`,
          {
            headers: {
              Authorization: `Bearer ${dataset.credentials.token}`,
            },
          },
        );
        const json = await res.json();
        return json.results;
      }),
    );
    return projectItems.flat(1);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export const posthog: Integration = {
  name: "Posthog",
  authType: "token",
  objects: {
    user: {
      name: "Current User",
      get: async (dataset: Dataset) => {
        if (!dataset.credentials?.token) return null;
        const res = await fetch("https://app.posthog.com/api/users/@me/", {
          headers: {
            Authorization: `Bearer ${dataset.credentials.token}`,
          },
        });
        return res.json();
      },
      objId: (dataset: Dataset) => {
        return `currentUser`;
      },
    },
  },
  tables: {
    projects: {
      name: "Projects",
      async get(dataset) {
        if (!dataset.credentials?.token) return [];
        const res = await fetch("https://app.posthog.com/api/projects/", {
          headers: {
            Authorization: `Bearer ${dataset.credentials.token}`,
          },
        });
        const json = await res.json();
        return json.results;
      },
      rowId(dataset, row) {
        return `${row.id}`;
      },
    },
    dashboards: {
      name: "Dashboards",
      async get(dataset, db) {
        return getProjectChildren(db, dataset, "dashboards");
      },
      rowId(dataset, row) {
        return `${row.id}`;
      },
    },
    insights: {
      name: "Insights",
      async get(dataset, db) {
        return getProjectChildren(db, dataset, "insights");
      },
      rowId(dataset, row) {
        return `${row.id}`;
      },
    },
  },
};
