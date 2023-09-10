import { deserialize } from "../../utils/serialization";
import { db } from "../../db/db.server";
import { Integration } from "../integration-types";
import { Dataset } from "../types";
import { rowsTable, tablesTable } from "../../db/schema";
import { and, eq } from "drizzle-orm";

async function getProjectChildren(dataset: Dataset, urlPath: string) {
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
        const projectIds: string[] = rows.map(
            (row) => deserialize(row.data).id,
        );
        const projectItems = await Promise.all(
            projectIds.map(async (id): Promise<any[]> => {
                const res = await fetch(
                    `https://app.posthog.com/api/projects/${id}/${urlPath}`,
                    {
                        headers: {
                            Authorization: `Bearer ${dataset.token}`,
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
    objects: {
        user: {
            name: "Current User",
            get: async (dataset: Dataset) => {
                const res = await fetch(
                    "https://app.posthog.com/api/users/@me/",
                    {
                        headers: {
                            Authorization: `Bearer ${dataset.token}`,
                        },
                    },
                );
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
                const res = await fetch(
                    "https://app.posthog.com/api/projects/",
                    {
                        headers: {
                            Authorization: `Bearer ${dataset.token}`,
                        },
                    },
                );
                const json = await res.json();
                return json.results;
            },
            rowId(dataset, row) {
                return `${row.id}`;
            },
        },
        dashboards: {
            name: "Dashboards",
            async get(dataset) {
                return getProjectChildren(dataset, "dashboards");
            },
            rowId(dataset, row) {
                return `${row.id}`;
            },
        },
        insights: {
            name: "Insights",
            async get(dataset) {
                return getProjectChildren(dataset, "insights");
            },
            rowId(dataset, row) {
                return `${row.id}`;
            },
        },
    },
};
