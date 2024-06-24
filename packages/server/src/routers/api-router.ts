import { Hono } from "hono";
import { Env } from "../types.ts";
import { datasetsTable } from "@mainframe-so/shared";
import { eq } from "drizzle-orm";
import { getIntegrationFromType } from "../lib/integrations.ts";
import { ensureDB } from "../utils/ensure-db.ts";
import { syncAll } from "../sync.ts";

// TODO: Accept Proxy-Authorization to get the db. This is currently done on
//       the express middleware.
export const apiRouter = new Hono<Env>()
  .all("/proxy/:datasetId/*", async (c) => {
    // Read from Hono context
    const req = c.req.raw;
    const db = c.var.db;
    ensureDB(db);
    const datasetId = c.req.param("datasetId");

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

    // Delegate request to the integration
    const apiRes = await integration.proxyFetch(dataset, apipath, {
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
  .post("/sync/all", async (c) => {
    const db = c.var.db;
    ensureDB(db);
    await syncAll(db);
    // TODO: Return 202 when we start a background job
    c.status(204);
    return c.body(null);
  });
