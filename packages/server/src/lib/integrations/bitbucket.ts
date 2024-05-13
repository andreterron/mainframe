import { getTokenFromDataset } from "../integration-token";
import { Integration } from "../integration-types";
import { Dataset } from "@mainframe-so/shared";

export const bitbucket: Integration = {
  name: "BitBucket",
  authType: "token",
  authTypes: {
    nango: {
      integrationId: "bitbucket",
    },
  },
  authSetupDocs:
    "https://developer.atlassian.com/cloud/bitbucket/rest/intro/#access-tokens",
  objects: {
    currentUser: {
      name: "Current User",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return null;
        const res = await fetch("https://api.bitbucket.org/2.0/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
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
    workspaces: {
      name: "Workspaces",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return [];
        return getWorkspaces(token);
      },
      rowId(dataset, row) {
        return `${row.uuid.replace(/^{/, "").replace(/}$/, "")}`;
      },
    },
    repos: {
      name: "Repos",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return [];
        return getUserRepos(token);
      },
      rowId(dataset, row) {
        return `${row.uuid.replace(/^{/, "").replace(/}$/, "")}`;
      },
    },
    pipelines: {
      name: "Pipelines",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return [];
        const repos = await getUserRepos(token);
        const reposPipelines = await Promise.all(
          repos.map(async (repo) => {
            const res = await fetch(
              `https://api.bitbucket.org/2.0/repositories/${repo.workspace.uuid}/${repo.slug}/pipelines`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                },
              },
            );
            return (await res.json()).values as any[];
          }),
        );
        const pipelines = reposPipelines.flat();
        return pipelines;
      },
      rowId(dataset, row) {
        return `${row.uuid.replace(/^{/, "").replace(/}$/, "")}`;
      },
    },
  },
};

async function getWorkspaces(token: string) {
  const res = await fetch(`https://api.bitbucket.org/2.0/workspaces`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return (await res.json()).values as any[];
}

async function getWorkspacesRepos(token: string, workspaceBracedUuid: string) {
  const res = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${workspaceBracedUuid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  return (await res.json()).values as any[];
}

async function getUserRepos(token: string) {
  const workspaces = await getWorkspaces(token);
  const workspaceRepos = await Promise.all(
    workspaces.map(async (workspace) => {
      return getWorkspacesRepos(token, workspace.uuid);
    }),
  );
  const repos = workspaceRepos.flat();
  return repos;
}
