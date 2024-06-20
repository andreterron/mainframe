import { Integration } from "../integration-types.ts";
import { Dataset, Row } from "@mainframe-so/shared";
import { syncTable, updateObject, updateRowFromTableType } from "../../sync.ts";
import { getDatasetObject, getDatasetTable } from "../integrations.ts";
import crypto from "node:crypto";
import { objectsTable, rowsTable, tablesTable } from "@mainframe-so/shared";
import { and, eq } from "drizzle-orm";
import { deserialize } from "../../utils/serialization.ts";
import { HTTPException } from "hono/http-exception";
import { Buffer } from "node:buffer";

function togglHeaders(dataset: Dataset) {
  return {
    Authorization: dataset.credentials?.token
      ? `Basic ${Buffer.from(dataset.credentials.token + ":api_token").toString(
          "base64",
        )}`
      : "",
    "User-Agent": "Mainframe <mainframe.so>",
  };
}

export interface TogglWebhookBase {
  event_id: number;
  created_at: string;
  creator_id: number;
  subscription_id: number;
  timestamp: string;
  url_callback: string;
}

export interface TogglWebhookPing extends TogglWebhookBase {
  metadata: {
    request_type: "POST";
    event_user_id: number;
  };
  payload: "ping";
  validation_code: string;
  validation_code_url: string;
}

export interface TogglWebhookEvent<T = any> extends TogglWebhookBase {
  metadata: {
    action: "created" | "updated" | "deleted";
    event_user_id: string;
    model:
      | "client"
      | "project"
      | "project_group"
      | "project_user"
      | "tag"
      | "task"
      | "time_entry"
      | "workspace"
      | "workspace_user";
    model_owner_id: string;
    path: string;
    project_id: string;
    project_is_private: string;
    request_body: string;
    request_type: "PUT" | "POST" | "DELETE" | "PATCH";
    time_entry_id: string;
    workspace_id: string;
  };
  payload: T;
}

export type TogglWebhook = TogglWebhookPing | TogglWebhookEvent;

function isPingWebhookEvent(event: TogglWebhook): event is TogglWebhookPing {
  return event.payload === "ping";
}

const startEntry = async (dataset: Dataset, input: { workspaceId: string }) => {
  const res = await fetch(
    `https://api.track.toggl.com/api/v9/workspaces/${input.workspaceId}/time_entries`,
    {
      method: "POST",
      headers: togglHeaders(dataset),
      body: JSON.stringify({
        created_with: "Mainframe (https://mainframe.so)",
        description: null,
        tags: [],
        billable: false,
        workspace_id: input.workspaceId,
        duration: -1,
        start: new Date().toISOString(),
        stop: null,
      }),
    },
  );
  if (res.ok) {
    return res.json();
  }
  console.error(await res.text());
};

export const toggl: Integration = {
  name: "Toggl",
  authType: "token",
  authSetupDocs:
    "https://github.com/andreterron/mainframe/blob/main/packages/docs/integrations/toggl.md",
  setupWebhooks: async (db, dataset: Dataset, baseApiUrl: string) => {
    // Remove trailing slashes
    const normalizedBaseApiUrl = baseApiUrl.replace(/\/+$/, "");
    if (!normalizedBaseApiUrl) {
      // Empty baseApiUrl
      console.log("Skipping Toggl webhooks: Empty baseApiUrl");
      return;
    }

    // TODO: Add dependency on list of workspaces?
    const res = await fetch(
      "https://api.track.toggl.com/api/v9/me/workspaces",
      {
        headers: togglHeaders(dataset),
      },
    );
    if (!res.ok) {
      return;
    }
    const workspaces: any[] = await res.json();
    const workspaceIds: number[] = workspaces.map((row) => row.id);

    for (let id of workspaceIds) {
      const callbackUrl = `${normalizedBaseApiUrl}/webhooks/${dataset.id}`;

      // Check if this workspace already has a webhook subscription
      const res = await fetch(
        `https://api.track.toggl.com/webhooks/api/v1/subscriptions/${id}`,
        {
          headers: togglHeaders(dataset),
        },
      );
      if (!res.ok) {
        console.error(`Failed to read webhooks for id ${id}`, typeof id);
        console.error(await res.text());
        continue;
      }
      const json: any[] = await res.json();

      // Find the valid webhook subscription
      let webhookToThis = json.find(
        (subscription) => subscription.url_callback === callbackUrl,
      );

      if (!webhookToThis) {
        // Create a webhook if it doesn't exist
        const createRes = await fetch(
          `https://api.track.toggl.com/webhooks/api/v1/subscriptions/${id}`,
          {
            method: "POST",
            headers: togglHeaders(dataset),
            body: JSON.stringify({
              url_callback: callbackUrl,
              event_filters: [{ entity: "*", action: "*" }],
              enabled: true,
              description: "Mainframe webhook subscription",
            }),
          },
        );
        if (!createRes.ok) {
          console.error(`Failed to create for id ${id}`, typeof id);
          console.error(await createRes.text());
          continue;
        }

        webhookToThis = await createRes.json();

        // TODO: The table could be synced only after all subscriptions are created
        // Save subscription to DB
        const table = getDatasetTable(dataset, "webhooks");

        if (!table) {
          console.error("Table not found");
          continue;
        }

        await syncTable(db, dataset, table);
      }

      if (webhookToThis) {
        if (!webhookToThis.validated_at) {
          await fetch(
            `https://api.track.toggl.com/webhooks/api/v1/ping/${id}/${webhookToThis.subscription_id}`,
            {
              method: "POST",
              headers: togglHeaders(dataset),
            },
          );
        } else if (!webhookToThis.enabled) {
          await fetch(
            `https://api.track.toggl.com/webhooks/api/v1/subscriptions/${id}/${webhookToThis.subscription_id}`,
            {
              method: "PATCH",
              headers: togglHeaders(dataset),
              body: JSON.stringify({
                enabled: true,
              }),
            },
          );
        }
      }
    }
  },
  webhook: async (db, dataset, req) => {
    if (
      req.headers.get("Content-Type") !== "application/json" ||
      req.method !== "POST"
    ) {
      // Toggl only sends POST events with Content-Type: application/json
      // https://developers.track.toggl.com/docs/webhooks_start/validating_received_events#other-considerations
      console.log("Invalid Toggl webhook received");
      throw new HTTPException(400);
    }

    if (typeof req.body !== "string") {
      console.log("Webhook body wasn't a string");
      throw new HTTPException(400);
    }

    const json = JSON.parse(req.body) as TogglWebhook;

    // We just validate if we find a webhook on the DB, otherwise just return 200
    // The reason is that we'll get a "ping" event before saving the subscription to the DB
    let webhook: Row | undefined;
    try {
      [webhook] = await db
        .select({
          id: rowsTable.id,
          sourceId: rowsTable.sourceId,
          tableId: rowsTable.tableId,
          data: rowsTable.data,
        })
        .from(rowsTable)
        .innerJoin(tablesTable, eq(tablesTable.id, rowsTable.tableId))
        .where(
          and(
            eq(tablesTable.datasetId, dataset.id),
            eq(tablesTable.key, "webhooks"),
            eq(rowsTable.sourceId, `${json.subscription_id}`),
          ),
        )
        .limit(1);
    } catch (e) {
      console.log("Error getting webhook", e);
      return new Response("Ok", { status: 200 });
    }
    if (!webhook) {
      console.log("Webhook not found");
      return new Response("Ok", { status: 200 });
    }

    const message = req.body;
    const signature = req.headers.get("x-webhook-signature-256");
    const secret = deserialize(webhook.data).secret;

    const hmac = crypto.createHmac("sha256", secret).setEncoding("hex");
    hmac.update(message);

    if (!signature) {
      console.error("Missing Signature");

      throw new HTTPException(400);
    }

    if (signature.replace(/^.*=/, "") !== hmac.digest("hex")) {
      console.log("Invalid HMAC");
      throw new HTTPException(400);
    }

    // Valid HMAC

    if (isPingWebhookEvent(json)) {
      console.log("Toggl Webhook Ping event");
      // @ts-ignore This should work. tsup or rollu-dts-plugin are failing
      return Response.json(
        { validation_code: json.validation_code },
        { status: 400 },
      );
    }

    if (json.metadata.model === "time_entry") {
      const table = getDatasetTable(dataset, "timeEntries");
      if (table?.rowId) {
        await updateRowFromTableType(
          db,
          json.payload,
          table.rowId(dataset, json.payload),
          json.payload,
        );
      } else {
        console.error("Failed to find timeEntries definition");
        return new Response(null, { status: 204 });
      }

      // Update currentTimeEntry if needed
      let [currentEntryRow] = await db
        .select({
          id: objectsTable.id,
          sourceId: objectsTable.sourceId,
          objectType: objectsTable.objectType,
          datasetId: objectsTable.datasetId,
          data: objectsTable.data,
        })
        .from(objectsTable)
        .where(
          and(
            eq(objectsTable.datasetId, dataset.id),
            eq(objectsTable.objectType, "currentEntry"),
          ),
        )
        .limit(1);

      const object = getDatasetObject(dataset, "currentEntry");

      if (
        object?.objId &&
        (json.payload.stop === null ||
          deserialize(currentEntryRow?.data ?? null)?.id === json.payload.id)
      ) {
        await updateObject(
          db,
          dataset,
          json.metadata.action === "deleted" || json.payload.stop
            ? null
            : json.payload,
          json.payload && json.metadata.action !== "deleted"
            ? object.objId(dataset, json.payload)
            : null,
          object.id,
        );
      }
    }

    return new Response(null, { status: 204 });
  },
  objects: {
    currentEntry: {
      name: "Current Time Entry",
      get: async (dataset: Dataset) => {
        const res = await fetch(
          "https://api.track.toggl.com/api/v9/me/time_entries/current",
          {
            headers: togglHeaders(dataset),
          },
        );
        if (res.ok) {
          return res.json();
        }
        console.error(
          `Request failed with status ${res.status}:\n${await res.text()}`,
        );
        return null;
      },
      objId: (dataset: Dataset, obj) => {
        return `${obj.id}`;
      },
    },
  },
  tables: {
    timeEntries: {
      name: "Time Entries",
      get: async (dataset: Dataset) => {
        const res = await fetch(
          "https://api.track.toggl.com/api/v9/me/time_entries",
          {
            headers: togglHeaders(dataset),
          },
        );
        if (res.ok) {
          return res.json();
        }
        console.error(
          `Request failed with status ${res.status}:\n${await res.text()}`,
        );
        return null;
      },
      rowId: (dataset: Dataset, row: any) => `${row.id}`,
    },
    // projects: {
    //     name: "Projects",
    // },
    workspaces: {
      name: "Workspaces",
      get: async (dataset: Dataset) => {
        const res = await fetch(
          "https://api.track.toggl.com/api/v9/me/workspaces",
          {
            headers: togglHeaders(dataset),
          },
        );
        if (res.ok) {
          return res.json();
        }
        console.error(
          `Request failed with status ${res.status}:\n${await res.text()}`,
        );
        return null;
      },
      rowId: (dataset: Dataset, row: any) => `${row.id}`,
    },
    // clients: {
    //     name: "Clients",
    // },
    // tasks: {
    //     name: "Tasks",
    // },
    webhooks: {
      name: "Webhook Subscriptions",
      get: async (dataset: Dataset, db) => {
        try {
          const rows = await db
            .select({
              id: rowsTable.id,
              sourceId: rowsTable.sourceId,
              tableId: rowsTable.tableId,
              data: rowsTable.data,
            })
            .from(rowsTable)
            .innerJoin(tablesTable, eq(tablesTable.id, rowsTable.tableId))
            .where(
              and(
                eq(tablesTable.datasetId, dataset.id),
                eq(tablesTable.key, "workspaces"),
              ),
            );

          const workspaceIds: string[] = rows.map(
            (row) => deserialize(row.data).id,
          );

          const workspaceSubscriptions = await Promise.all(
            workspaceIds.map(async (id): Promise<any[]> => {
              const res = await fetch(
                `https://api.track.toggl.com/webhooks/api/v1/subscriptions/${id}`,
                {
                  headers: togglHeaders(dataset),
                },
              );
              if (!res.ok) {
                console.log(
                  "Failed to read subscriptions for workspace",
                  id,
                  typeof id,
                );
                console.error(await res.text());
                return [];
              }
              const json: any[] = await res.json();
              if (!Array.isArray(json)) {
                return [];
              }
              return json;
            }),
          );
          return workspaceSubscriptions.flat(1);
        } catch (e) {
          console.error(e);
          return [];
        }
      },
      rowId: (dataset: Dataset, row: any) => `${row.subscription_id}`,
    },
  },
  actions: {
    start_entry: startEntry,
    stop_current_entry: async (dataset: Dataset) => {
      // Get current entry
      const res = await fetch(
        "https://api.track.toggl.com/api/v9/me/time_entries/current",
        {
          headers: togglHeaders(dataset),
        },
      );
      if (!res.ok) {
        console.error(res.text());
        return;
      }

      const json = await res.json();
      const entry = json;

      // Stop the entry
      await fetch(
        `https://api.track.toggl.com/api/v9/workspaces/${entry.workspace_id}/time_entries/${entry.id}/stop`,
        {
          method: "PATCH",
          headers: togglHeaders(dataset),
        },
      );
    },
    toggle_current_entry_running: async (
      dataset: Dataset,
      input: { workspaceId: string },
    ) => {
      // Get current entry
      const res = await fetch(
        "https://api.track.toggl.com/api/v9/me/time_entries/current",
        {
          headers: togglHeaders(dataset),
        },
      );
      if (!res.ok) {
        console.error(res.text());
        return;
      }

      const json = await res.json();
      const entry = json;

      if (entry === null) {
        await startEntry(dataset, { workspaceId: input.workspaceId });
      } else {
        // Stop the entry
        await fetch(
          `https://api.track.toggl.com/api/v9/workspaces/${entry.workspace_id}/time_entries/${entry.id}/stop`,
          {
            method: "PATCH",
            headers: togglHeaders(dataset),
          },
        );
      }
    },
  },
};
