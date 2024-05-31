import { and, eq } from "drizzle-orm";
import { datasetsTable } from "@mainframe-so/shared";
import { Integration } from "../integration-types.js";
import { Dataset } from "@mainframe-so/shared";
import { z } from "zod";

const zPelotonAuthResponseBody = z.object({
  session_id: z.string().min(1),
  user_id: z.string().min(1),
  // "pubsub_session": {},
});

export const peloton: Integration = {
  name: "Peloton",
  authType: "token",
  authTypes: {
    form: {
      params: [
        {
          key: "username",
          label: "Username or email",
          placeholder: "Your Peloton username or email",
        },
        {
          key: "password",
          type: "password",
          label: "Password",
          placeholder: "Your Peloton password",
        },
      ],
      info: "We don't store your password.",
      async onSubmit(dataset: Dataset, params: Record<string, string>, db) {
        const res = await fetch("https://api.onepeloton.com/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username_or_email: params.username,
            password: params.password,
          }),
        });

        // TODO: this throws!
        const body = zPelotonAuthResponseBody.parse(await res.json());

        await db
          .update(datasetsTable)
          .set({
            credentials: { ...dataset.credentials, token: body.session_id },
          })
          .where(eq(datasetsTable.id, dataset.id));
      },
    },
  },
  objects: {
    currentUser: {
      name: "Current User",
      get: async (dataset: Dataset) => {
        return await getCurrentUser(dataset.credentials?.token);
      },
      objId: (dataset: Dataset, obj) => {
        return `${obj.id}`;
      },
    },
  },
  tables: {
    workouts: {
      name: "Workouts",
      async get(dataset, db) {
        if (!dataset.credentials?.token) return [];
        try {
          const user = await getCurrentUser(dataset.credentials?.token);

          const user_id = user.id;
          let workouts = await fetch(
            `https://api.onepeloton.com/api/user/${user_id}/workouts?joins=ride,ride.instructor&limit=100&page=0&sort_by=-created`,
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
          // TODO: Get more metrics for each workout: https://api.onepeloton.com/api/workout/${workout_id}/performance_graph?every_n=5

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

async function getCurrentUser(token: string | undefined | null) {
  if (!token) return null;
  const res = await fetch("https://api.onepeloton.com/api/me", {
    headers: {
      "Content-Type": "application/json",
      Cookie: `peloton_session_id=${token}`,
    },
  });
  return res.json();
}
