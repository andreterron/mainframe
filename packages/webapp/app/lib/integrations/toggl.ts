import { Integration } from "../integration-types";
import { Dataset } from "../types";

function togglHeaders(dataset: Dataset) {
    return {
        Authorization: `Basic ${Buffer.from(
            dataset.token + ":api_token",
        ).toString("base64")}`,
    };
}

export const toggl: Integration = {
    name: "Toggl",
    objects: {
        currentEntry: {
            name: "Current Time Entry",
            get: async (dataset: Dataset) => {
                const res = await fetch(
                    "https://api.track.toggl.com/api/v9/me/time_entries/current",
                    {
                        headers: togglHeaders(dataset),
                    },
                );
                if (res.ok) {
                    return res.json();
                }
                console.error(
                    `Request failed with status ${
                        res.status
                    }:\n${await res.text()}`,
                );
                return null;
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
                        headers: togglHeaders(dataset),
                    },
                );
                if (res.ok) {
                    return res.json();
                }
                console.error(
                    `Request failed with status ${
                        res.status
                    }:\n${await res.text()}`,
                );
                return null;
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
