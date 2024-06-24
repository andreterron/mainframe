import { Hono } from "hono";
import { Env } from "../types.ts";
import { datasetsTable } from "@mainframe-so/shared";
import { eq } from "drizzle-orm";
import { getIntegrationForDataset } from "../lib/integrations.ts";
import { ensureDB } from "../utils/ensure-db.ts";
import { HTTPException } from "hono/http-exception";

export const webhookRouter = new Hono<Env>().all(
  "/:dataset_id/*?",
  async (c) => {
    ensureDB(c.var.db);
    const datasetId = c.req.param("dataset_id");
    console.log(`Received webhook request for dataset ${datasetId}`);
    if (!datasetId) {
      throw new HTTPException(400);
    }
    const [dataset] = await c.var.db
      .select()
      .from(datasetsTable)
      .where(eq(datasetsTable.id, datasetId))
      .limit(1);
    if (!dataset) {
      throw new HTTPException(404);
    }
    const integration = getIntegrationForDataset(dataset);

    if (!integration?.webhook) {
      throw new HTTPException(404);
    }

    return integration.webhook(c.var.db, dataset, c.req.raw);
  },
);
