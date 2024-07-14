import { Context, Hono } from "hono";
import { Env } from "../types.ts";
import {
  Operation,
  datasetsTable,
  objectsTable,
  rowsTable,
} from "@mainframe-api/shared";
import { and, eq } from "drizzle-orm";
import { getIntegrationFromType } from "../lib/integrations.ts";
import { ensureDB } from "../utils/ensure-db.ts";
import { syncAll } from "../sync.ts";
import { HTTPException } from "hono/http-exception";
import { deserializeData } from "../utils/serialization.ts";
import { getTokenFromDataset } from "../lib/integration-token.ts";
import { accepts } from "hono/accepts";
import { cors } from "hono/cors";
import { env } from "../lib/env.server.ts";

export interface ApiRouterHooks<E extends Env = Env> {
  /**
   * Callback to check if this API request should be authorized. For more
   * control, use a Hono middleware.
   * @param c Hono context
   * @returns true if authorized, false otherwise.
   */
  isApiRequestAuthorized(c: Context<E>): Promise<boolean> | boolean;
}

export function createApiRouter<E extends Env = Env>(hooks: ApiRouterHooks<E>) {
  const hono = new Hono<E>();

  // Cors
  hono.use(async (c, next) => {
    const origin = c.req.header("origin");
    if (origin && origin === env.APP_URL) {
      // Include credentials when the origin is the defined app origin
      return cors({ origin: env.APP_URL, credentials: true })(c, next);
    } else {
      return cors()(c, next);
    }
  });

  // Auth
  hono.use(async (c: Context<E>, next) => {
    if (await hooks.isApiRequestAuthorized(c)) {
      return next();
    }
    throw new HTTPException(401);
  });

  return (
    hono
      // TODO: Accept Proxy-Authorization to get the db. This is currently done on
      //       the express middleware.
      .all("/proxy/:dataset_id/*", async (c) => {
        // Read from Hono context
        const req = c.req.raw;
        const db = c.var.db;
        ensureDB(db);
        const datasetId = c.req.param("dataset_id");

        // Get integration for that dataset
        const [dataset] = await db
          .select()
          .from(datasetsTable)
          .where(eq(datasetsTable.id, datasetId))
          .limit(1);

        const integration = getIntegrationFromType(
          dataset?.integrationType ?? undefined,
        );

        if (!dataset || !integration?.proxyFetch) {
          return c.notFound();
        }

        // Prepare path
        const { pathname, search } = new URL(req.url);
        // TODO: Don't use hardcoded /api/proxy/${datasetId}.
        const apipath = `${pathname.replace(
          `/api/proxy/${datasetId}/`,
          "",
        )}${search}`;

        // Delete headers
        const headers = new Headers(req.headers);
        headers.delete("Host");
        headers.delete("Authorization");
        headers.delete("Proxy-Authorization");
        // NOTE: These might not be needed
        headers.delete("Content-Encoding");
        headers.delete("Content-Length");

        const token = await getTokenFromDataset(dataset);

        if (!token) {
          throw new HTTPException(407);
        }

        // Delegate request to the integration
        const apiRes = await integration.proxyFetch(token, apipath, {
          ...req,
          headers,
          redirect: "manual",
          integrity: undefined,
        });

        const res = new Response(apiRes.body, apiRes);

        // The content is already decoded when using fetch
        res.headers.delete("Content-Encoding");
        res.headers.delete("Content-Length");

        return res;
      })

      .post("/sync/all", async (c: Context<E>) => {
        const db = c.var.db;
        ensureDB(db);
        await syncAll(db);
        // TODO: Return 202 when we start a background job
        c.status(204);
        return c.body(null);
      })

      .get("/table/:table_id/rows", async (c: Context<E>) => {
        ensureDB(c.var.db);
        const rows = await c.var.db
          .select({ id: rowsTable.id, data: rowsTable.data })
          .from(rowsTable)
          .where(eq(rowsTable.tableId, c.req.param("table_id")))
          .limit(100);

        return c.json(rows.map(deserializeData));
      })

      .get("/credentials/:dataset_id", async (c: Context<E>) => {
        ensureDB(c.var.db);
        // Get the dataset info
        const [dataset] = await c.var.db
          .select()
          .from(datasetsTable)
          .where(eq(datasetsTable.id, c.req.param("dataset_id")))
          .limit(1);

        if (!dataset) {
          throw new HTTPException(404);
        }

        const token = await getTokenFromDataset(dataset);

        return c.json({ token });
      })

      .get("/object/:dataset_id/:object_type", async (c: Context<E>) => {
        ensureDB(c.var.db);
        const [object] = await c.var.db
          .select({ id: objectsTable.id, data: objectsTable.data })
          .from(objectsTable)
          .where(
            and(
              eq(objectsTable.datasetId, c.req.param("dataset_id")),
              eq(objectsTable.objectType, c.req.param("object_type")),
            ),
          )
          .limit(1);

        if (!object) {
          throw new HTTPException(404);
        }

        return c.json(deserializeData(object));
      })

      .post("/action/:dataset_id/:action_name", async (c: Context<E>) => {
        ensureDB(c.var.db);
        // Get the dataset info
        const [dataset] = await c.var.db
          .select()
          .from(datasetsTable)
          .where(eq(datasetsTable.id, c.req.param("dataset_id")))
          .limit(1);
        const integration = getIntegrationFromType(
          dataset?.integrationType ?? undefined,
        );

        // Call the action
        const action = integration?.actions?.[c.req.param("action_name")];
        if (!dataset || !action) {
          throw new HTTPException(404);
        }

        try {
          const json = await c.req.json();
          const result = await action(dataset, json);
          if (result) {
            return c.json(result);
          } else {
            c.status(204);
            return c.body(null);
          }
        } catch (e) {
          throw new HTTPException(500, { cause: e });
        }
      })

      .get("/operations", (c: Context<E>) => {
        // TODO: Consider sending a JSON array back
        // TODO: Add a ?since= query parameter

        if (
          accepts(c, {
            header: "Accept",
            supports: ["text/event-stream"],
            default: "text/event-stream",
          })
        ) {
          // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events

          // res.flushHeaders();
          const stream = new TransformStream<string, string>();

          if (!c.var.operations) {
            throw new HTTPException(401);
          }

          const operations = c.var.operations;

          async function setupOperationsPipe() {
            const writer = stream.writable.getWriter();

            await writer.write(`data:${JSON.stringify({ type: "ping" })}\n\n`);

            function sendOperation(operation: Operation) {
              writer.write(`data:${JSON.stringify(operation)}\n\n`);
            }

            if (!c.req.raw.signal.aborted) {
              operations.addListener("operation", sendOperation);
              c.req.raw.signal.addEventListener("abort", (ev) => {
                operations.removeListener("operation", sendOperation);
                writer.close();
              });
            }
          }

          // We don't await this promise to return the response faster
          void setupOperationsPipe().catch((e) => {
            console.error("Error setting up /operations pipe");
            console.error(e);
          });

          return new Response(
            stream.readable.pipeThrough(new TextEncoderStream()),
            {
              status: 200,
              headers: {
                "X-Accel-Buffering": "no",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Content-Type": "text/event-stream",
              },
            },
          );
        }

        throw new HTTPException(415);
      })
  );
}
