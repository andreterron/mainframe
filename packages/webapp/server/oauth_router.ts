import { Request, Router } from "express";
import { getIntegrationForDataset } from "./lib/integrations";
import { db } from "./db/db.server";
import { datasetsTable } from "../app/db/schema";
import { eq } from "drizzle-orm";

export const oauthRouter = Router();

function getBaseUrl(req: Request) {
    // TODO: Ensure that when tunneling, the protocol will be https, and not http
    return `${req.protocol}://${req.header("host")}/oauth/callback`;
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

    const url = await integration.getOAuthUrl(baseUrl, dataset);

    if (!url) {
        res.status(400).send("Integration doesn't support oauth");
        return;
    }

    res.redirect(url);
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

    await integration.oauthCallback(baseUrl, dataset, req.query as any);

    res.redirect(`/dataset/${dataset.id}`);
});
