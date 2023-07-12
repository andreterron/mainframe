import { Integration } from "../integration-types";
import { Dataset } from "../types";
import icon from "./icons/github.png";

export const github: Integration = {
    name: "GitHub",
    icon,
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
            objId: (dataset: Dataset & { _id: string }) => {
                return `${dataset._id}_me`;
            },
        },
    },
    tables: {
        repos: {
            name: "Repos",
            get: async (dataset: Dataset & { _id: string }) => {
                const res = await fetch(`https://api.github.com/user/repos`, {
                    headers: {
                        Authorization: `Bearer ${dataset.token}`,
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                });
                return res.json();
            },
            rowId(dataset, row) {
                return `${dataset._id}_repos_${row.id}`;
            },
        },
    },
};
