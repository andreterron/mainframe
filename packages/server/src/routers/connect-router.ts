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
import {
  ensureSessionCookie,
  getSessionFromCookie,
} from "../lib/connect-cookies.ts";
import { nanoid } from "nanoid";
import { getIntegrationFromType } from "../lib/integrations.ts";
import { nango } from "../lib/nango.ts";
import { AuthModes } from "@nangohq/node";

export const connectRouter = new Hono<Env>()
  // TODO: Review this cors() call
  .use(
    cors({
      origin: (origin) => origin,
      credentials: true,
    }),
  )
  .get("/apps", async (c) => {
    if (!c.var.userId) {
      throw new HTTPException(401);
    }
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }
    const apps = await connectDB
      .select({
        id: appsTable.id,
        name: appsTable.name,
        ownerId: appsTable.ownerId,
      })
      .from(appsTable)
      .where(eq(appsTable.ownerId, c.var.userId));
    return c.json(apps);
  })
  .post(
    "/apps",
    zValidator(
      "json",
      z.object({
        // TODO: Make name optional
        name: z.string().min(1),
      }),
    ),
    async (c) => {
      if (!c.var.userId) {
        throw new HTTPException(401);
      }
      if (!connectDB) {
        console.error("Missing connectDB");
        throw new HTTPException(500);
      }
      const body = c.req.valid("json");
      const [inserted] = await connectDB
        .insert(appsTable)
        .values({
          ownerId: c.var.userId,
          name: body.name,
        })
        .returning({ id: appsTable.id });
      if (!inserted) {
        throw new HTTPException(500, { message: "Failed to create app" });
      }
      return c.json({ id: inserted.id });
    },
  )
  .get("/apps/:app_id", async (c) => {
    if (!c.var.userId) {
      throw new HTTPException(401);
    }
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }
    const [app] = await connectDB
      .select({
        id: appsTable.id,
        name: appsTable.name,
        ownerId: appsTable.ownerId,
        showSetup: appsTable.showSetup,
      })
      .from(appsTable)
      .where(
        and(
          eq(appsTable.ownerId, c.var.userId),
          eq(appsTable.id, c.req.param().app_id),
        ),
      );
    if (!app) {
      throw new HTTPException(404);
    }
    return c.json(app);
  })
  .put(
    "/apps/:app_id",
    zValidator(
      "json",
      z
        .object({
          name: z.string().min(1).optional(),
          showSetup: z.boolean().optional(),
        })
        .refine((arg) =>
          Object.keys(arg).some((key) => arg[key] !== undefined),
        ),
    ),
    async (c) => {
      if (!c.var.userId) {
        throw new HTTPException(401);
      }
      if (!connectDB) {
        console.error("Missing connectDB");
        throw new HTTPException(500);
      }
      const body = c.req.valid("json");
      const [app] = await connectDB
        .update(appsTable)
        .set({
          name: body.name,
          showSetup: body.showSetup,
        })
        .where(
          and(
            eq(appsTable.ownerId, c.var.userId),
            eq(appsTable.id, c.req.param().app_id),
          ),
        )
        .returning();
      if (!app) {
        throw new HTTPException(404);
      }
      return c.json(app);
    },
  )
  .delete("/apps/:app_id", async (c) => {
    if (!c.var.userId) {
      throw new HTTPException(401);
    }
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }
    await connectDB
      .delete(appsTable)
      .where(
        and(
          eq(appsTable.ownerId, c.var.userId),
          eq(appsTable.id, c.req.param().app_id),
        ),
      );
    return new Response(null, { status: 204 });
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
      .select({
        id: connectionsTable,
        provider: connectionsTable.provider,
        nangoConnectionId: connectionsTable.nangoConnectionId,
      })
      .from(connectionsTable)
      .where(eq(connectionsTable.sessionId, sessionId));

    return c.json(
      connections.map((c) => ({
        id: c.id,
        provider: c.provider,
        connected: !!c.nangoConnectionId,
      })),
    );
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
    const sessionId = getSessionFromCookie(c);

    if (!sessionId) {
      throw new HTTPException(401);
    }

    const [connection] = await connectDB
      .select({
        id: connectionsTable.id,
        provider: connectionsTable.provider,
        nangoConnectionId: connectionsTable.nangoConnectionId,
      })
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

    return c.json({
      id: connection.id,
      provider: connection.provider,
      connected: !!connection.nangoConnectionId,
    });
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

      // TODO: Remove appId param
      const appId = c.req.param("app_id");
      const connectionId = c.req.param("connection_id");
      const sessionId = getSessionFromCookie(c);

      if (!sessionId) {
        throw new HTTPException(401);
      }

      const [updated] = await connectDB
        .update(connectionsTable)
        .set({
          nangoConnectionId: nangoConnectionId,
        })
        .where(
          and(
            eq(connectionsTable.id, connectionId),
            isNull(connectionsTable.nangoConnectionId),
            eq(connectionsTable.sessionId, sessionId),
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
  )
  .all("/proxy/:connection_id/*", async (c) => {
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }
    const sessionId = getSessionFromCookie(c);

    if (!sessionId) {
      throw new HTTPException(407);
    }
    // Read from Hono context
    const req = c.req.raw;
    const connectionId = c.req.param("connection_id");

    // Get integration for that dataset
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

    const integration = getIntegrationFromType(connection?.provider);

    if (!connection?.nangoConnectionId || !integration?.proxyFetch) {
      return c.notFound();
    }

    // Prepare path
    const { pathname, search } = new URL(req.url);
    // TODO: Don't use hardcoded path.
    const apipath = `${pathname.replace(
      `/connect/proxy/${connectionId}/`,
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

    const nangoConnection = await nango?.getConnection(
      // TODO: Don't hardcode provider string
      "github-oauth-app",
      connection.id,
      false,
    );
    if (nangoConnection?.credentials.type !== AuthModes.OAuth2) {
      throw new HTTPException(407);
    }
    const token = nangoConnection.credentials.access_token;

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
  });

export type ConnectAPIType = typeof connectRouter;
