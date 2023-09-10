import { Request, Response } from "express";
import { db } from "../../db/db.server";
import { Integration } from "../integration-types";
import { Dataset, DatasetObject, Row } from "../types";
import {
    syncTable,
    updateObject,
    updateRowFromTableType,
} from "../../../server/sync";
import { getDatasetObject, getDatasetTable } from "../integrations";
import crypto from "crypto";
import { env } from "../env.server";
import { objectsTable, rowsTable, tablesTable } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { deserialize } from "../../utils/serialization";

function togglHeaders(dataset: Dataset) {
    return {
        Authorization: `Basic ${Buffer.from(
            dataset.token + ":api_token",
        ).toString("base64")}`,
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

export const toggl: Integration = {
    name: "Toggl",
    setup: async (dataset: Dataset) => {
        if (!env.TUNNEL_BASE_API_URL) {
            // No tunnel URL
            console.log("Skipping Toggl webhooks: Missing tunnel URL");
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
            const callbackUrl = `${env.TUNNEL_BASE_API_URL}/webhooks/${dataset.id}`;

            // Check if this workspace already has a webhook subscription
            const res = await fetch(
                `https://api.track.toggl.com/webhooks/api/v1/subscriptions/${id}`,
                {
                    headers: togglHeaders(dataset),
                },
            );
            if (!res.ok) {
                console.error(
                    `Failed to read webhooks for id ${id}`,
                    typeof id,
                );
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

                await syncTable(dataset, table);
            }

            if (webhookToThis && !webhookToThis.validated_at) {
                await fetch(
                    `https://api.track.toggl.com/webhooks/api/v1/ping/${id}/${webhookToThis.subscription_id}`,
                    {
                        method: "POST",
                        headers: togglHeaders(dataset),
                    },
                );
            }
        }
    },
    webhook: async (dataset, req: Request, res: Response) => {
        if (
            req.header("Content-Type") !== "application/json" ||
            req.method !== "POST"
        ) {
            // Toggl only sends POST events with Content-Type: application/json
            // https://developers.track.toggl.com/docs/webhooks_start/validating_received_events#other-considerations
            console.log("Invalid Toggl webhook received");
            return res.sendStatus(400);
        }

        if (typeof req.body !== "string") {
            console.log("Webhook body wasn't a string");
            return res.sendStatus(400);
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
                        eq(tablesTable.key, "webhook"),
                        eq(rowsTable.sourceId, `${json.subscription_id}`),
                    ),
                )
                .limit(1);
        } catch (e) {
            return res.sendStatus(200);
        }
        if (!webhook) {
            return res.sendStatus(200);
        }

        const message = req.body;
        const signature = req.header("x-webhook-signature-256");
        const secret = deserialize(webhook.data).secret;

        const hmac = crypto.createHmac("sha256", secret).setEncoding("hex");
        hmac.update(message);

        if (!signature) {
            console.error("Missing Signature");
            return res.sendStatus(400);
        }

        if (signature.replace(/^.*=/, "") !== hmac.digest("hex")) {
            console.log("Invalid HMAC");
            return res.sendStatus(400);
        }

        // Valid HMAC

        if (isPingWebhookEvent(json)) {
            return res.send({ validation_code: json.validation_code });
        }

        if (json.metadata.model === "time_entry") {
            const table = getDatasetTable(dataset, "timeEntries");
            if (table?.rowId) {
                await updateRowFromTableType(
                    json.payload,
                    table.rowId(dataset, json.payload),
                    json.payload,
                );
            } else {
                console.error("Failed to find timeEntries definition");
                return res.sendStatus(204);
            }

            // Update currentTimeEntry if needed
            let currentEntryRow: DatasetObject | undefined;
            try {
                // currentEntryRow = await db.get(`${dataset.id}_currentEntry`);
                [currentEntryRow] = await db
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
            } catch (e: any) {
                if (e.error !== "not_found") {
                    throw e;
                }
                // We might not have a currentEntry, but we can still check if the received time entry is active
            }

            const object = getDatasetObject(dataset, "currentEntry");

            if (
                object?.objId &&
                (json.payload.stop === null ||
                    deserialize(currentEntryRow?.data ?? null).id ===
                        json.payload.id)
            ) {
                await updateObject(
                    dataset,
                    json.payload,
                    object.objId(dataset, json.payload),
                    object.id,
                );
            }
        }

        return res.sendStatus(204);
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
                    `Request failed with status ${
                        res.status
                    }:\n${await res.text()}`,
                );
                return null;
            },
            objId: (dataset: Dataset) => {
                return `${dataset.id}_currentEntry`;
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
                    `Request failed with status ${
                        res.status
                    }:\n${await res.text()}`,
                );
                return null;
            },
            rowId: (dataset: Dataset, row: any) => `${dataset.id}_${row.id}`,
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
                    `Request failed with status ${
                        res.status
                    }:\n${await res.text()}`,
                );
                return null;
            },
            rowId: (dataset: Dataset, row: any) =>
                `${dataset.id}_workspace_${row.id}`,
        },
        // clients: {
        //     name: "Clients",
        // },
        // tasks: {
        //     name: "Tasks",
        // },
        webhooks: {
            name: "Webhook Subscriptions",
            get: async (dataset: Dataset) => {
                try {
                    const rows = await db
                        .select({
                            id: rowsTable.id,
                            sourceId: rowsTable.sourceId,
                            tableId: rowsTable.tableId,
                            data: rowsTable.data,
                        })
                        .from(rowsTable)
                        .innerJoin(
                            tablesTable,
                            eq(tablesTable.id, rowsTable.tableId),
                        )
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
            rowId: (dataset: Dataset, row: any) =>
                `${dataset.id}_webhook_${row.subscription_id}`,
        },
    },
};
