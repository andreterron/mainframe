import { Integration } from "../integration-types";
import { Dataset } from "../types";

export const github: Integration = {
    name: "GitHub",
    objects: {
        currentUser: {
            name: "Current User",
            get: async (dataset: Dataset) => {
                const res = await fetch("https://api.github.com/user", {
                    headers: {
                        Authorization: `Bearer ${dataset.token}`,
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
                const res = await fetch(`https://api.github.com/user/repos`, {
                    headers: {
                        Authorization: `Bearer ${dataset.token}`,
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
