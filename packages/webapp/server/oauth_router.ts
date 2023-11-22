import { Request, Router } from "express";
import { getIntegrationForDataset } from "./lib/integrations";
import { db } from "./db/db.server";
import { datasetsTable } from "../app/db/schema";
import { eq } from "drizzle-orm";

export const oauthRouter = Router();

function getBaseUrl(req: Request) {
  // If the host is localhost, an IPv4, or ends in .lan, assume it's http
  // Otherwise, assume it's https.
  // TODO: Consider a more configurable way to determine between http and https
  const host = req.header("host");
  const protocol = host?.match(
    /(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\.lan$)/,
  )
    ? "http"
    : "https";
  return `${protocol}://${host}/oauth/callback`;
}

oauthRouter.get("/start/:dataset_id", async (req, res) => {
  const datasetId = req.params.dataset_id;

  if (!datasetId) {
    res.status(404).send("Invalid dataset id");
    return;
  }

  const [dataset] = await db
    .select()
    .from(datasetsTable)
    .where(eq(datasetsTable.id, datasetId))
    .limit(1);
  if (!dataset) {
    res.status(404).send("Dataset not found");
    return;
  }

  const integration = getIntegrationForDataset(dataset);
  if (!integration) {
    res.status(404).send("Integration not found");
    return;
  }

  if (!integration.getOAuthUrl) {
    res.status(400).send("Integration doesn't support oauth");
    return;
  }

  const baseUrl = getBaseUrl(req);

  try {
    const url = await integration.getOAuthUrl(baseUrl, dataset);

    if (!url) {
      res.status(400).send("Integration doesn't support oauth");
      return;
    }

    res.redirect(url);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

oauthRouter.get("/callback/:dataset_id", async (req, res) => {
  const datasetId = req.params.dataset_id;

  if (!datasetId) {
    res.status(404).send("Invalid dataset id");
    return;
  }

  const [dataset] = await db
    .select()
    .from(datasetsTable)
    .where(eq(datasetsTable.id, datasetId))
    .limit(1);
  if (!dataset) {
    res.status(404).send("Dataset not found");
    return;
  }

  const integration = getIntegrationForDataset(dataset);
  if (!integration) {
    res.status(404).send("Integration not found");
    return;
  }

  if (!integration.oauthCallback) {
    res.status(400).send("Integration doesn't support oauth");
    return;
  }

  const baseUrl = getBaseUrl(req);

  try {
    await integration.oauthCallback(baseUrl, dataset, req.query as any);
    res.redirect(`/dataset/${dataset.id}`);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});
