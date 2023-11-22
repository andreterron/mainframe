import { and, eq } from "drizzle-orm";
import { db } from "../../db/db.server";
import { objectsTable } from "../../../app/db/schema";
import { Integration } from "../../../app/lib/integration-types";
import { Dataset } from "../../../app/lib/types";
import { deserialize } from "../../../app/utils/serialization";

export const peloton: Integration = {
  name: "Peloton",
  authType: "token",
  objects: {
    currentUser: {
      name: "Current User",
      get: async (dataset: Dataset) => {
        if (!dataset.credentials?.token) return null;
        const res = await fetch("https://api.onepeloton.com/api/me", {
          headers: {
            "Content-Type": "application/json",
            Cookie: `peloton_session_id=${dataset.credentials.token}`,
          },
        });
        return res.json();
      },
      objId: (dataset: Dataset, obj) => {
        return `${obj.id}`;
      },
    },
  },
  tables: {
    workouts: {
      name: "Workouts",
      async get(dataset) {
        if (!dataset.credentials?.token) return [];
        try {
          const [user] = await db
            .select()
            .from(objectsTable)
            .where(
              and(
                eq(objectsTable.datasetId, dataset.id),
                eq(objectsTable.objectType, "currentUser"),
              ),
            )
            .limit(1);

          // const session_id = '';
          const user_id = deserialize(user.data).id;
          let workouts = await fetch(
            `https://api.onepeloton.com/api/user/${user_id}/workouts?joins=ride,ride.instructor&limit=20&page=0&sort_by=-created`,
            {
              method: "get",
              headers: {
                "Content-Type": "application/json",
                Cookie: `peloton_session_id=${dataset.credentials.token}`,
              },
            },
          );
          const json = await workouts.json();
          return json.data;
          // const res = await fetch(
          //     "https://api.track.toggl.com/api/v9/me/time_entries",
          //     {
          //         headers: {
          //             Authorization: `Bearer ${dataset.token}`,
          //         },
          //     },
          // );
          // return res.json();
        } catch (e) {
          // Try again next time
          console.error(e);
          return [];
        }
      },
      rowId: (dataset: Dataset, row: any) => `${row.id}`,
    },
  },
};
