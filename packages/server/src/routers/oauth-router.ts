import { getIntegrationForDataset } from "../lib/integrations.ts";
import { datasetsTable } from "@mainframe-so/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "../types.ts";
import { ensureDB } from "../utils/ensure-db.ts";
import { env } from "../lib/env.server.ts";

function getBaseUrl(req: Request) {
  // If the host is localhost, an IPv4, or ends in .lan, assume it's http
  // Otherwise, assume it's https.
  // TODO: Consider a more configurable way to determine between http and https
  const host = req.headers.get("host");
  const protocol = host?.match(
    /(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\.lan$)/,
  )
    ? "http"
    : "https";
  return `${protocol}://${host}/oauth/callback`;
}

export const oauthRouter = new Hono<Env>().get(
  "/start/:dataset_id",
  async (c) => {
    const datasetId = c.req.param("dataset_id");
    const db = c.var.db;
    ensureDB(db);

    if (!datasetId) {
      throw new HTTPException(404, { message: "Invalid dataset id" });
    }

    const [dataset] = await db
      .select()
      .from(datasetsTable)
      .where(eq(datasetsTable.id, datasetId))
      .limit(1);
    if (!dataset) {
      throw new HTTPException(404, { message: "Dataset not found" });
    }

    const integration = getIntegrationForDataset(dataset);
    if (!integration) {
      throw new HTTPException(404, { message: "Integration not found" });
    }

    if (!integration.getOAuthUrl) {
      throw new HTTPException(400, {
        message: "Integration doesn't support oauth",
      });
    }

    const baseUrl = getBaseUrl(c.req.raw);

    try {
      const url = await integration.getOAuthUrl(baseUrl, dataset);

      if (!url) {
        throw new HTTPException(400, {
          message: "Integration doesn't support oauth",
        });
      }

      return c.redirect(url);
    } catch (e) {
      console.error(e);
      throw new HTTPException(500, { cause: e });
    }
  },
);

oauthRouter.get("/callback/:dataset_id", async (c) => {
  const datasetId = c.req.param("dataset_id");
  const db = c.var.db;
  ensureDB(db);

  if (!datasetId) {
    throw new HTTPException(404, { message: "Invalid dataset id" });
  }

  const [dataset] = await db
    .select()
    .from(datasetsTable)
    .where(eq(datasetsTable.id, datasetId))
    .limit(1);
  if (!dataset) {
    throw new HTTPException(404, { message: "Dataset not found" });
  }

  const integration = getIntegrationForDataset(dataset);
  if (!integration) {
    throw new HTTPException(404, { message: "Integration not found" });
  }

  if (!integration.oauthCallback) {
    throw new HTTPException(404, {
      message: "Integration doesn't support oauth",
    });
  }

  const baseUrl = getBaseUrl(c.req.raw);

  try {
    await integration.oauthCallback(baseUrl, dataset, c.req.query() as any, db);
    return c.redirect(`${env.APP_URL}/dataset/${dataset.id}`);
  } catch (e) {
    console.error(e);
    throw new HTTPException(500, { cause: e });
  }
});
