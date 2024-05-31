import { getTokenFromDataset } from "../integration-token.js";
import { Integration } from "../integration-types.js";
import { Dataset } from "@mainframe-so/shared";

export const render: Integration = {
  name: "Render",
  authType: "token",
  authSetupDocs: "https://docs.render.com/api#creating-an-api-key",
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
    services: {
      name: "Services",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return [];
        const res = await fetch(`https://api.render.com/v1/services?limit=20`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const list: any[] = await res.json();
        return list.map((row) => row.service);
      },
      rowId(dataset, row) {
        return `${row.id}`;
      },
    },
    deploys: {
      name: "Deploys",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return [];
        const res = await fetch(`https://api.render.com/v1/services?limit=20`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const servicesResponse: any[] = await res.json();
        const services = servicesResponse.map((row) => row.service);
        const deploys: any[] = [];
        for (let service of services) {
          const deploysRes = await fetch(
            `https://api.render.com/v1/services/${service.id}/deploys?limit=50`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            },
          );
          const deployRes: any[] = await deploysRes.json();
          deploys.push(...deployRes.map((row) => ({ ...row.deploy, service })));
        }
        return deploys;
      },
      rowId(dataset, row) {
        return `${row.id}`;
      },
    },
  },
};
