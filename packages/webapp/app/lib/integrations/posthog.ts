import { db } from "../db";
import { Integration } from "../integration-types";
import { Dataset, Row } from "../types";

async function getProjectChildren(
    dataset: Dataset & { _id: string },
    urlPath: string,
) {
    try {
        const rows = (await db.find({
            selector: {
                type: "row",
                table: "projects",
                datasetId: dataset._id,
            },
        })) as PouchDB.Find.FindResponse<Row>;
        const projectIds: string[] = rows.docs.map((row) => row.data.id);
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
            objId: (dataset: Dataset & { _id: string }) => {
                return `${dataset._id}_currentUser`;
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
                return `${dataset._id}_projects_${row.id}`;
            },
        },
        dashboards: {
            name: "Dashboards",
            async get(dataset) {
                return getProjectChildren(dataset, "dashboards");
            },
            rowId(dataset, row) {
                return `${dataset._id}_dashboards_${row.id}`;
            },
        },
        insights: {
            name: "Insights",
            async get(dataset) {
                return getProjectChildren(dataset, "insights");
            },
            rowId(dataset, row) {
                return `${dataset._id}_insights_${row.id}`;
            },
        },
    },
};
