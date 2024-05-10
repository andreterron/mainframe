import { getTokenFromDataset } from "../integration-token";
import { Integration } from "../integration-types";
import { Dataset } from "@mainframe-so/shared";

export const spotify: Integration = {
  name: "Spotify",
  underReview: true,
  authTypes: {
    nango: {
      integrationId: "spotify",
    },
  },
  objects: {
    currentUser: {
      name: "Current User",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return null;
        const res = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${token}`,
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
      name: "Top tracks",
      get: async (dataset: Dataset) => {
        const token = await getTokenFromDataset(dataset);
        if (!token) return [];
        const res = await fetch(
          `https://api.spotify.com/v1/me/top/tracks?limit=50&offset=0`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!res.ok) {
          console.log("Failed to get top tracks", await res.text());
          return [];
        }
        const tracks: any[] = (await res.json()).items;
        return tracks.map((item, i) => ({ ...item, index: i + 1 }));
      },
      rowId(dataset, row) {
        return `${row.id}`;
      },
    },
  },
};
