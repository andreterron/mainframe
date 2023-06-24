import { Integration } from "../integration-types";

export const toggl: Integration = {
    tables: {
        timeEntries: {
            name: "Time Entries",
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
