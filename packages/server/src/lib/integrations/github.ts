import { getTokenFromDataset } from "../integration-token.ts";
import { Integration } from "../integration-types.ts";
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
  async proxyFetch(token: string, path: string, init) {
    const headers = new Headers(init?.headers);
    if (!token) return new Response("Unauthorized", { status: 407 });

    headers.set("Authorization", `Bearer ${token}`);
    headers.set("X-GitHub-Api-Version", "2022-11-28");

    // TODO: Check if the response needs to be cleaned
    return fetch(`https://api.github.com/${path}`, { ...init, headers });
  },
  computed: {
    issues: {
      name: "Issues",
      // TODO: Use tRPC-like API to define params
      params: [
        { key: "owner", label: "Owner", placeholder: "facebook" },
        { key: "repo", label: "Repo", placeholder: "react" },
      ],
      get: async (
        dataset: Dataset,
        params: { owner: string; repo: string },
      ) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return [];
        const res = await fetch(
          `https://api.github.com/repos/${params.owner}/${params.repo}/issues?per_page=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-GitHub-Api-Version": "2022-11-28",
            },
          },
        );
        return await res.json();
      },
    },
  },
};
