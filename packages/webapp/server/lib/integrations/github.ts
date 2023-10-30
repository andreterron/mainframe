import { Integration } from "../../../app/lib/integration-types";
import { Dataset } from "../../../app/lib/types";

export const github: Integration = {
    name: "GitHub",
    authType: "token",
    objects: {
        currentUser: {
            name: "Current User",
            get: async (dataset: Dataset) => {
                if (!dataset.credentials?.token) return null;
                const res = await fetch("https://api.github.com/user", {
                    headers: {
                        Authorization: `Bearer ${dataset.credentials.token}`,
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                });
                return res.json();
            },
            objId: (dataset: Dataset, obj) => {
                return `me`;
            },
        },
    },
    tables: {
        repos: {
            name: "Repos",
            get: async (dataset: Dataset) => {
                if (!dataset.credentials?.token) return [];
                const res = await fetch(`https://api.github.com/user/repos`, {
                    headers: {
                        Authorization: `Bearer ${dataset.credentials.token}`,
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                });
                return res.json();
            },
            rowId(dataset, row) {
                return `${row.id}`;
            },
        },
    },
};
