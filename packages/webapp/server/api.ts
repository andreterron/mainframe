import { Router } from "express";
import { Operation, operations } from "./lib/operations";
import { getSessionFromId } from "./sessions.server";

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

    const sessionId = parseBearerHeader(authorization);

    const session = sessionId ? await getSessionFromId(sessionId) : undefined;

    if (!session?.data.userId) {
        res.sendStatus(401);
    } else {
        next();
    }
});

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
