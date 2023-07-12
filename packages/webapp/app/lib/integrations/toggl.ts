import { Integration } from "../integration-types";
import { Dataset } from "../types";
import icon from "./icons/toggl.png";

export const toggl: Integration = {
    name: "Toggl",
    icon,
    objects: {
        currentEntry: {
            name: "Current Time Entry",
            get: async (dataset: Dataset) => {
                const res = await fetch(
                    "https://api.track.toggl.com/api/v9/me/time_entries/current",
                    {
                        headers: {
                            Authorization: `Bearer ${dataset.token}`,
                        },
                    },
                );
                return res.json();
            },
            objId: (dataset: Dataset & { _id: string }) => {
                return `${dataset._id}_currentEntry`;
            },
        },
    },
    tables: {
        timeEntries: {
            name: "Time Entries",
            get: async (dataset: Dataset) => {
                const res = await fetch(
                    "https://api.track.toggl.com/api/v9/me/time_entries",
                    {
                        headers: {
                            Authorization: `Bearer ${dataset.token}`,
                        },
                    },
                );
                return res.json();
            },
            rowId: (dataset: Dataset & { _id: string }, row: any) =>
                `${dataset._id}_${row.id}`,
        },
        // projects: {
        //     name: "Projects",
        // },
        // workspaces: {
        //     name: "Workspaces",
        // },
        // clients: {
        //     name: "Clients",
        // },
        // tasks: {
        //     name: "Tasks",
        // },
    },
};
