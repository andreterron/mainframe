import { and, eq } from "drizzle-orm";
import { db } from "../../db/db.server";
import { objectsTable } from "../../db/schema";
import { Integration } from "../integration-types";
import { Dataset } from "../types";
import { deserialize } from "../../utils/serialization";

export const peloton: Integration = {
    name: "Peloton",
    objects: {
        currentUser: {
            name: "Current User",
            get: async (dataset: Dataset) => {
                const res = await fetch("https://api.onepeloton.com/api/me", {
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: `peloton_session_id=${dataset.token}`,
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
                try {
                    const [user] = await db
                        .select()
                        .from(objectsTable)
                        .where(
                            and(
                                eq(objectsTable.datasetId, dataset.id),
                                eq(objectsTable.objectType, "me"),
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
                                Cookie: `peloton_session_id=${dataset.token}`,
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
