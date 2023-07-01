import { Integration } from "../integration-types";
import { Dataset } from "../types";

export const toggl: Integration = {
    name: "Toggl",
    tables: {
        timeEntries: {
            name: "Time Entries",
            get: async (dataset: Dataset) => {
                const res = await fetch(
                    "https://1ak.io/toggl/api/v9/me/time_entries",
                    {
                        headers: {
                            Authorization: `Bearer ${dataset.oakToken}`,
                        },
                    },
                );
                return res.json();
            },
            rowId: (dataset: Dataset & { _id: string }, row: any) =>
                `${dataset._id}_${row.id}`,
        },
        projects: {
            name: "Projects",
        },
        workspaces: {
            name: "Workspaces",
        },
        clients: {
            name: "Clients",
        },
        tasks: {
            name: "Tasks",
        },
    },
};
