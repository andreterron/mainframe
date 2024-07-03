import { Hono } from "hono";
import { Env } from "../types.ts";
import { eq } from "drizzle-orm";
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
import { uniqueId } from "lodash-es";

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
        id: uniqueId("session_"),
        appId: appId,
      })
      .returning({ id: sessionsTable.id });
    // TODO: Handle if appId doesn't exist
    if (!inserted) {
      throw new HTTPException(500, { message: "Failed to create session" });
    }
    return c.json({ id: inserted.id });
  })
  .get("/sessions/:session_id/connections", async (c) => {
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }
    const sessionId = c.req.param("session_id");

    const connections = await connectDB
      .select({ id: connectionsTable, provider: connectionsTable.provider })
      .from(connectionsTable)
      .where(eq(connectionsTable.sessionId, sessionId));

    return c.json(connections);
  })
  .post(
    "/sessions/:session_id/connections",
    zValidator(
      "json",
      z.object({
        nangoConnectionId: z.string(),
        provider: z.enum(["github"]),
      }),
    ),
    async (c) => {
      if (!connectDB) {
        console.error("Missing connectDB");
        throw new HTTPException(500);
      }
      const { provider, nangoConnectionId } = c.req.valid("json");

      const [inserted] = await connectDB
        .insert(connectionsTable)
        .values({
          id: uniqueId("conn_"),
          nangoConnectionId: nangoConnectionId,
          provider: provider,
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
  );
