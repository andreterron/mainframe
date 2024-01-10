import { Router } from "express";
import { Operation, operations } from "./lib/operations";
import {
  getSessionFromId,
  getSessionIdFromCookieHeader,
} from "./sessions.server";
import { db } from "./db/db.server";
import { datasetsTable, objectsTable, rowsTable } from "../app/db/schema";
import { and, eq } from "drizzle-orm";
import { deserializeData } from "../app/utils/serialization";
import { getIntegrationFromType } from "./lib/integrations";
import bodyParser from "body-parser";

export const apiRouter = Router();

function parseBearerHeader(header: string | undefined) {
  if (!header) {
    return undefined;
  }

  const match = header.match(/^Bearer\s+(.*)$/);

  if (match) {
    return match[1];
  }
}

apiRouter.use(async (req, res, next) => {
  const authorization = req.header("authorization");

  const sessionId =
    parseBearerHeader(authorization) ??
    getSessionIdFromCookieHeader(req.header("cookie"));

  const session = sessionId ? await getSessionFromId(sessionId) : undefined;

  if (!session?.data.userId) {
    res.sendStatus(401);
  } else {
    next();
  }
});

apiRouter.get("/table/:table_id/rows", async (req, res) => {
  const rows = await db
    .select({ id: rowsTable.id, data: rowsTable.data })
    .from(rowsTable)
    .where(eq(rowsTable.tableId, req.params.table_id))
    .limit(100);

  res.contentType("application/json");
  res.send(JSON.stringify(rows.map(deserializeData)));
});

apiRouter.get("/object/:dataset_id/:object_type", async (req, res) => {
  const [object] = await db
    .select({ id: objectsTable.id, data: objectsTable.data })
    .from(objectsTable)
    .where(
      and(
        eq(objectsTable.datasetId, req.params.dataset_id),
        eq(objectsTable.objectType, req.params.object_type),
      ),
    )
    .limit(1);

  res.contentType("application/json");
  res.send(JSON.stringify(deserializeData(object)));
  // const rows = await db
  //     .select({ id: rowsTable.id, data: rowsTable.data })
  //     .from(rowsTable)
  //     .where(
  //         eq(tablesTable.key, req.params.table_id),
  //     )
  //     .limit(100);
  // res.send(JSON.stringify(rows.map(deserializeData)))
});

apiRouter.post(
  "/action/:dataset_id/:action_name",
  bodyParser.json(),
  async (req, res) => {
    // Get the dataset info
    const [dataset] = await db
      .select()
      .from(datasetsTable)
      .where(eq(datasetsTable.id, req.params.dataset_id))
      .limit(1);
    const integration = getIntegrationFromType(
      dataset?.integrationType ?? undefined,
    );

    // Call the action
    const action = integration?.actions?.[req.params.action_name];
    if (!action) {
      res.sendStatus(404);
      return;
    }

    try {
      const result = await action(dataset, req.body);
      if (result) {
        res.contentType("json").send(JSON.stringify(result));
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  },
);

apiRouter.get("/operations", (req, res) => {
  if (req.accepts("text/event-stream")) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
    res.status(200);
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.contentType("text/event-stream");

    res.flushHeaders();

    res.write(`data:${JSON.stringify({ type: "ping" })}\n\n`);

    function sendOperation(operation: Operation) {
      res.write(`data:${JSON.stringify(operation)}\n\n`);
    }

    operations.addListener("operation", sendOperation);

    req.on("close", function (err: any) {
      operations.removeListener("operation", sendOperation);
      res.end();
    });
    return;
  }

  // TODO: Consider sending a JSON array back
  // TODO: Add a ?since= query parameter

  res.sendStatus(415);
});
