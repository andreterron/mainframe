import { Integration } from "../../../app/lib/integration-types";
import { Dataset } from "@mainframe-so/shared";

function zoteroHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "3",
  };
}

async function getKeyUserId(token: string) {
  const res = await fetch(`https://api.zotero.org/keys/${token}`, {
    headers: zoteroHeaders(token),
  });
  const json = await res.json();
  return json.userID as number;
}

export const zotero: Integration = {
  name: "Zotero",
  authType: "token",
  authSetupDocs:
    "https://github.com/andreterron/mainframe/blob/main/packages/docs/integrations/zotero.md",
  objects: {
    key: {
      name: "Key",
      get: async (dataset: Dataset) => {
        const token = dataset.credentials?.token;
        if (!token) {
          return null;
        }
        const res = await fetch(`https://api.zotero.org/keys/${token}`, {
          headers: zoteroHeaders(token),
        });
        return await res.json();
      },
      objId(dataset, obj) {
        // TODO: What to do here?
        return "key";
      },
    },
  },
  tables: {
    collections: {
      name: "Collections",
      async get(dataset) {
        const token = dataset.credentials?.token;
        if (!token) {
          return null;
        }
        const userId = await getKeyUserId(token);
        const userOrGroupPrefix = `users/${userId}`; // TODO: Support groups as well
        const res = await fetch(
          `https://api.zotero.org/${userOrGroupPrefix}/collections`,
          {
            headers: zoteroHeaders(token),
          },
        );
        // TODO: Handle errors
        const rows: any[] = await res.json();
        return rows.map((row) => row.data);
      },
      rowId(dataset, row) {
        return row.key;
      },
    },
    items: {
      name: "Items",
      async get(dataset) {
        const token = dataset.credentials?.token;
        if (!token) {
          return null;
        }
        const userId = await getKeyUserId(token);
        const userOrGroupPrefix = `users/${userId}`; // TODO: Support groups as well
        const res = await fetch(
          `https://api.zotero.org/${userOrGroupPrefix}/items`,
          {
            headers: zoteroHeaders(token),
          },
        );
        // TODO: Handle errors
        const rows: any[] = await res.json();
        return rows.map((row) => row.data);
      },
      rowId(dataset, row) {
        return row.key;
      },
    },
    tags: {
      name: "Tags",
      async get(dataset) {
        const token = dataset.credentials?.token;
        if (!token) {
          return null;
        }
        const userId = await getKeyUserId(token);
        const userOrGroupPrefix = `users/${userId}`; // TODO: Support groups as well
        const res = await fetch(
          `https://api.zotero.org/${userOrGroupPrefix}/tags`,
          {
            headers: zoteroHeaders(token),
          },
        );
        // TODO: Handle errors
        const rows: any[] = await res.json();
        return rows;
      },
      rowId(dataset, row) {
        return row.tag;
      },
    },
  },
};
