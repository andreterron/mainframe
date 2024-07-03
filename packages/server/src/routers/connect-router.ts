import { Hono } from "hono";
import { Env } from "../types.ts";
import { eq, and, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { cors } from "hono/cors";
import { connectDB } from "../lib/connect-db.ts";
import {
  appsTable,
  connectionsTable,
  sessionsTable,
} from "../db/connect-db/connect-schema.ts";
import { ensureSessionCookie } from "../lib/connect-cookies.ts";
import { nanoid } from "nanoid";

export const connectRouter = new Hono<Env>()
  // TODO: Review this cors() call
  .use(
    cors({
      origin: (origin) => origin,
      credentials: true,
    }),
  )
  .post("/apps", zValidator("json", z.object({})), async (c) => {
    if (!c.var.userId) {
      throw new HTTPException(401);
    }
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }
    const [inserted] = await connectDB
      .insert(appsTable)
      .values({
        ownerId: c.var.userId,
      })
      .returning({ id: appsTable.id });
    if (!inserted) {
      throw new HTTPException(500, { message: "Failed to create app" });
    }
    return c.json({ id: inserted.id });
  })
  .post("/apps/:app_id/sessions", async (c) => {
    // TODO: Make sure this only accepts requests from the app_id domains.
    // Use CORS and referrer for that.
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }
    const appId = c.req.param("app_id");

    const [inserted] = await connectDB
      .insert(sessionsTable)
      .values({
        id: `session_${nanoid()}`,
        appId: appId,
      })
      .returning({ id: sessionsTable.id });
    // TODO: Handle if appId doesn't exist
    if (!inserted) {
      throw new HTTPException(500, { message: "Failed to create session" });
    }
    return c.json({ id: inserted.id });
  })
  .get("/apps/:app_id/connections", async (c) => {
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }

    const appId = c.req.param("app_id");
    const sessionId = await ensureSessionCookie(c, appId);

    const connections = await connectDB
      .select({ id: connectionsTable, provider: connectionsTable.provider })
      .from(connectionsTable)
      .where(eq(connectionsTable.sessionId, sessionId));

    return c.json(connections);
  })
  .post(
    "/apps/:app_id/connections",
    zValidator(
      "json",
      z.object({
        provider: z.enum(["github"]),
      }),
    ),
    async (c) => {
      if (!connectDB) {
        console.error("Missing connectDB");
        throw new HTTPException(500);
      }
      const { provider } = c.req.valid("json");

      const appId = c.req.param("app_id");
      const sessionId = await ensureSessionCookie(c, appId);

      const [inserted] = await connectDB
        .insert(connectionsTable)
        .values({
          id: `conn_${nanoid()}`,
          provider: provider,
          sessionId: sessionId,
        })
        .returning({ id: connectionsTable.id });
      // TODO: Handle if sessionId doesn't exist.
      if (!inserted) {
        throw new HTTPException(500, {
          message: "Failed to create connection",
        });
      }
      return c.json({ id: inserted.id });
    },
  )
  .get("/apps/:app_id/connections/:connection_id", async (c) => {
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }

    // We don't need app_id here
    const appId = c.req.param("app_id");
    const connectionId = c.req.param("connection_id");
    const sessionId = await ensureSessionCookie(c, appId);

    const [connection] = await connectDB
      .select()
      .from(connectionsTable)
      .where(
        and(
          eq(connectionsTable.id, connectionId),
          eq(connectionsTable.sessionId, sessionId),
        ),
      )
      .limit(1);

    // TODO: Handle if any id doesn't exist.
    if (!connection) {
      throw new HTTPException(500, {
        message: "Failed to create connection",
      });
    }

    return c.json(connection);
  })
  .put(
    "/apps/:app_id/connections/:connection_id",
    zValidator(
      "json",
      z.object({
        nangoConnectionId: z.string(),
      }),
    ),
    async (c) => {
      if (!connectDB) {
        console.error("Missing connectDB");
        throw new HTTPException(500);
      }
      const { nangoConnectionId } = c.req.valid("json");

      const appId = c.req.param("app_id");
      const connectionId = c.req.param("connection_id");
      // const sessionId = await ensureSessionCookie(c, appId);

      const [updated] = await connectDB
        .update(connectionsTable)
        .set({
          nangoConnectionId: nangoConnectionId,
        })
        .where(
          and(
            eq(connectionsTable.id, connectionId),
            isNull(connectionsTable.nangoConnectionId),
            // TODO: ADD SOME PROTECTION!!!
            //       Since this is happening from the mainframe domain instead
            //       of our user's domain, the sessions won't match.
            //       One option is to generate a temporary random ID and use
            //       that in the URL to identify the connection session
            // eq(connectionsTable.sessionId, sessionId),
          ),
        )
        .returning({ id: connectionsTable.id });

      // TODO: Handle if any id doesn't exist.
      if (!updated) {
        throw new HTTPException(500, {
          message: "Failed to create connection",
        });
      }

      return new Response(null, { status: 204 });
    },
  );
