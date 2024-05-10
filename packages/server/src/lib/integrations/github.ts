import { getTokenFromDataset } from "../integration-token";
import { Integration } from "../integration-types";
import { Dataset } from "@mainframe-so/shared";

export const github: Integration = {
  name: "GitHub",
  authType: "token",
  authTypes: {
    nango: {
      integrationId: "github-oauth-app",
    },
  },
  authSetupDocs:
    "https://docs.github.com/en/enterprise-server@3.6/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
  objects: {
    currentUser: {
      name: "Current User",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return null;
        const res = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
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
        const token = await getTokenFromDataset(dataset);
        if (!token) return [];
        const res = await fetch(
          `https://api.github.com/user/repos?per_page=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-GitHub-Api-Version": "2022-11-28",
            },
          },
        );
        return await res.json();
      },
      rowId(dataset, row) {
        return `${row.id}`;
      },
    },
  },
};
