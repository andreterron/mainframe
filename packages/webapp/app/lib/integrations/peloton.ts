import { db } from "../db";
import { Integration } from "../integration-types";
import { Dataset, Row } from "../types";

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
            objId: (dataset: Dataset & { _id: string }) => {
                return `${dataset._id}_me`;
            },
        },
    },
    tables: {
        workouts: {
            name: "Workouts",
            async get(dataset) {
                try {
                    const user: Row = await db.get(`${dataset._id}_me`);

                    // const session_id = '';
                    const user_id = user.data.id;
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
            rowId: (dataset: Dataset & { _id: string }, row: any) =>
                `${dataset._id}_${row.id}`,
        },
    },
};
