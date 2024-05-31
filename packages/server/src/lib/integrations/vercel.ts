import { getTokenFromDataset } from "../integration-token.js";
import { Integration } from "../integration-types.js";
import { Dataset } from "@mainframe-so/shared";

export const vercel: Integration = {
  name: "Vercel",
  authType: "token",
  authSetupDocs: "https://vercel.com/docs/rest-api#creating-an-access-token",
  objects: {
    // currentUser: {
    //   name: "Current User",
    //   get: async (dataset: Dataset) => {
    //     const token = await getTokenFromDataset(dataset);
    //     if (!token) return null;
    //     const res = await fetch("https://api.github.com/user", {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     });
    //     return res.json();
    //   },
    //   objId: (dataset: Dataset, obj) => {
    //     return `me`;
    //   },
    // },
  },
  tables: {
    deployments: {
      name: "Deployments",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return [];
        const res = await fetch(
          `https://api.vercel.com/v6/deployments?limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );
        return (await res.json()).deployments;
      },
      rowId(dataset, row) {
        return `${row.uid}`;
      },
    },
  },
};
