import { Hono } from "hono";
import { Env } from "../types.ts";
import {
  eq,
  and,
  isNull,
  gte,
  isNotNull,
  count,
  desc,
  sql,
  or,
} from "drizzle-orm";
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
  ensureSession,
  getSessionFromContext,
} from "../lib/connect-session.ts";
import { nanoid } from "nanoid";
import {
  getIntegrationFromType,
  supportedConnectProviders,
} from "../lib/integrations.ts";
import { nango } from "../lib/nango.ts";
import { env } from "../lib/env.server.ts";
import {
  CONNECT_LINK_TIMEOUT,
  MAINFRAME_PROXY_HEADER,
  MAINFRAME_SESSION_HEADER,
} from "../utils/constants.ts";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

export const connectRouter = new Hono<Env>()
  // TODO: Review this cors() call
  .use(
    cors({
      origin: (origin) => origin,
      credentials: true,
      exposeHeaders: [MAINFRAME_SESSION_HEADER],
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
        // TODO: This is counting connections instead of users
        connectionsCount: count(
          sql`CASE WHEN ${or(
            isNotNull(connectionsTable.nangoConnectionId),
            isNotNull(connectionsTable.token),
          )} THEN 1 END`,
        ),
        // TODO: Return integrations
      })
      .from(appsTable)
      .leftJoin(sessionsTable, eq(sessionsTable.appId, appsTable.id))
      .leftJoin(
        connectionsTable,
        eq(connectionsTable.sessionId, sessionsTable.id),
      )
      .groupBy(appsTable.id, appsTable.name, appsTable.ownerId)
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
  .get(
    "/apps/:app_id/users",
    zValidator(
      "query",
      z
        .object({
          offset: z.number().optional().default(0),
          limit: z
            .number()
            .min(1)
            .max(MAX_PAGE_SIZE)
            .optional()
            .default(DEFAULT_PAGE_SIZE),
        })
        .optional()
        .default({}),
    ),
    async (c) => {
      if (!c.var.userId) {
        throw new HTTPException(401);
      }
      if (!connectDB) {
        console.error("Missing connectDB");
        throw new HTTPException(500);
      }

      const appId = c.req.param("app_id");

      const q = c.req.valid("query");

      const [users, usersCount, providers] = await Promise.all([
        connectDB
          .select({
            id: connectionsTable.id,
            provider: connectionsTable.provider,
            initiatedAt: connectionsTable.initiatedAt,
          })
          .from(connectionsTable)
          .innerJoin(
            sessionsTable,
            eq(sessionsTable.id, connectionsTable.sessionId),
          )
          .innerJoin(appsTable, eq(appsTable.id, sessionsTable.appId))
          .where(
            and(
              eq(appsTable.ownerId, c.var.userId),
              eq(sessionsTable.appId, appId),
              or(
                isNotNull(connectionsTable.nangoConnectionId),
                isNotNull(connectionsTable.token),
              ),
            ),
          )
          .orderBy(desc(connectionsTable.initiatedAt))
          .offset(q.offset)
          .limit(q.limit),
        connectDB
          .select({ count: count() })
          .from(connectionsTable)
          .innerJoin(
            sessionsTable,
            eq(sessionsTable.id, connectionsTable.sessionId),
          )
          .innerJoin(appsTable, eq(appsTable.id, sessionsTable.appId))
          .where(
            and(
              eq(appsTable.ownerId, c.var.userId),
              eq(sessionsTable.appId, appId),
              or(
                isNotNull(connectionsTable.nangoConnectionId),
                isNotNull(connectionsTable.token),
              ),
            ),
          ),
        connectDB
          .select({
            provider: connectionsTable.provider,
            count: count(),
          })
          .from(connectionsTable)
          .innerJoin(
            sessionsTable,
            eq(sessionsTable.id, connectionsTable.sessionId),
          )
          .innerJoin(appsTable, eq(appsTable.id, sessionsTable.appId))
          .where(
            and(
              eq(appsTable.ownerId, c.var.userId),
              eq(sessionsTable.appId, appId),
              or(
                isNotNull(connectionsTable.nangoConnectionId),
                isNotNull(connectionsTable.token),
              ),
            ),
          ),
      ]);

      return c.json({
        data: users,
        count: usersCount[0]?.count ?? 0,
        providers: providers,
      });
    },
  )
  .get("/apps/:app_id/connections", async (c) => {
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }

    const appId = c.req.param("app_id");
    const sessionId = await ensureSession(c, appId);

    const connections = await connectDB
      .select({
        id: connectionsTable.id,
        provider: connectionsTable.provider,
      })
      .from(connectionsTable)
      .innerJoin(
        sessionsTable,
        eq(sessionsTable.id, connectionsTable.sessionId),
      )
      .where(
        and(
          eq(sessionsTable.appId, appId),
          eq(connectionsTable.sessionId, sessionId),
          or(
            isNotNull(connectionsTable.nangoConnectionId),
            isNotNull(connectionsTable.token),
          ),
        ),
      );

    return c.json(
      connections.map((c) => ({
        id: c.id,
        provider: c.provider,
      })),
    );
  })
  .delete("/sessions", async (c) => {
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }

    const sessionId = getSessionFromContext(c);

    if (!sessionId) {
      return new Response(null, { status: 204 });
    }

    await connectDB
      .delete(sessionsTable)
      .where(eq(sessionsTable.id, sessionId));

    return new Response(null, { status: 204 });
  })
  .post(
    "/apps/:app_id/connections",
    zValidator(
      "json",
      z.object({
        provider: z.enum(supportedConnectProviders),
      }),
    ),
    async (c) => {
      if (!connectDB) {
        console.error("Missing connectDB");
        throw new HTTPException(500);
      }
      const { provider } = c.req.valid("json");

      const appId = c.req.param("app_id");
      const sessionId = await ensureSession(c, appId);
      const linkId = nanoid(32);

      const [inserted] = await connectDB
        .insert(connectionsTable)
        .values({
          id: `conn_${nanoid()}`,
          provider: provider,
          sessionId: sessionId,
          initiatedAt: new Date(),
          linkId,
        })
        .returning({
          id: connectionsTable.id,
          provider: connectionsTable.provider,
          linkId: connectionsTable.linkId,
        });
      // TODO: Handle if sessionId doesn't exist.
      if (!inserted) {
        throw new HTTPException(500, {
          message: "Failed to create connection",
        });
      }
      return c.json({
        id: inserted.id,
        connectUrl: `${env.APP_URL}/connect/${inserted.linkId}`,
      });
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
    const sessionId = getSessionFromContext(c);

    if (!sessionId) {
      throw new HTTPException(401);
    }

    const [connection] = await connectDB
      .select({
        id: connectionsTable.id,
        provider: connectionsTable.provider,
        nangoConnectionId: connectionsTable.nangoConnectionId,
        token: connectionsTable.token,
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
      connected: !!(connection.nangoConnectionId || connection.token),
    });
  })
  .all("/proxy/:connection_id/*", async (c) => {
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }
    const sessionId = getSessionFromContext(c, {
      authHeader: MAINFRAME_PROXY_HEADER,
    });

    if (!sessionId) {
      throw new HTTPException(401);
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

    if (
      !connection ||
      !integration?.proxyFetch ||
      ((!connection.nangoConnectionId ||
        !integration?.authTypes?.nango?.integrationId) &&
        !connection.token)
    ) {
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
    headers.delete(MAINFRAME_PROXY_HEADER);
    // TODO: We might choose to keep the authorization header
    headers.delete("Authorization");
    // NOTE: These might not be needed
    headers.delete("Content-Encoding");
    headers.delete("Content-Length");

    let token: string | undefined;
    if (connection.token) {
      token = connection.token;
    } else if (integration.authTypes?.nango?.integrationId) {
      const nangoConnection = await nango?.getConnection(
        integration.authTypes.nango.integrationId,
        connection.id,
        false,
      );
      if (nangoConnection?.credentials.type !== "OAUTH2") {
        throw new HTTPException(401);
      }
      token = nangoConnection.credentials.access_token;
    } else {
      throw new HTTPException(500);
    }

    // Creates a new request overriding a few parameters.
    // NOTE: Destructuring req to create a RequestInit doesn't work:
    //       { ...req, headers }          // Doesn't work!
    //       new Request(req, {headers})  // This works!
    const newReq = new Request(req, {
      headers,
      redirect: "manual",
      integrity: undefined,
    });

    // Delegate request to the integration
    const apiRes = await integration.proxyFetch(token, apipath, newReq);

    const res = new Response(apiRes.body, apiRes);

    // The content is already decoded when using fetch
    res.headers.delete("Content-Encoding");
    res.headers.delete("Content-Length");

    return res;
  })
  .get("/link/:link_id", async (c) => {
    if (!connectDB) {
      console.error("Missing connectDB");
      throw new HTTPException(500);
    }
    const connection = await connectDB.query.connectionsTable.findFirst({
      columns: {
        id: true,
        provider: true,
      },
      with: {
        session: {
          columns: {
            appId: true,
          },
          with: {
            app: {
              columns: {
                id: true,
                name: true,
                // TODO: Logo, etc
              },
            },
          },
        },
      },
      where: (fields, { and, eq, isNull, gte }) =>
        and(
          eq(fields.linkId, c.req.param("link_id")),
          // Check that the link is for a connection that's not active
          isNull(fields.nangoConnectionId),
          isNull(fields.token),
          // Ensure the connection was initiated in the last 5 minutes
          gte(fields.initiatedAt, new Date(Date.now() - CONNECT_LINK_TIMEOUT)),
        ),
    });

    if (!connection) {
      throw new HTTPException(404);
    }

    return c.json({
      id: connection.id,
      provider: connection.provider,
      appId: connection.session.appId,
    });
  })
  // NOTE: This function doesn't check for an auth token or cookie on purpose.
  // The person navigates to this link from another website. So they might not
  // be logged into Mainframe, and we can't set a reliable cross-domain cookie
  // between the websites. These are the current protections on this endpoint:
  // 1. The nango provider needs to be valid
  // 2. We won't update if it already has a value
  // 3. Links expire after 5 minutes
  //
  // IDEA: We could set a cookie for the first session that opens this link,
  // that way, even if someone is sniffing the network, they wouldn't be able
  // to set the nangoConnectionId. To do this we'd likely want to do server
  // rendering. Note that if a malicious actor sniffs the response to the API
  // call that creates the connection, they could open the link_id before the
  // user. So it wouldn't fully solve the issue.
  .put(
    "/link/:link_id",
    zValidator(
      "json",
      z.union([
        z.object({
          nangoConnectionId: z.string(),
          apiKey: z.undefined().optional(),
        }),
        z.object({
          nangoConnectionId: z.undefined().optional(),
          apiKey: z.string(),
        }),
      ]),
    ),
    async (c) => {
      if (!connectDB) {
        console.error("Missing connectDB");
        throw new HTTPException(500);
      }
      const json = c.req.valid("json");

      if (json.nangoConnectionId) {
        // TODO: Validate nangoConnectionId with Nango
        const [updated] = await connectDB
          .update(connectionsTable)
          .set({
            nangoConnectionId: json.nangoConnectionId,
          })
          .where(
            and(
              eq(connectionsTable.linkId, c.req.param("link_id")),
              isNull(connectionsTable.nangoConnectionId),
              gte(
                connectionsTable.initiatedAt,
                new Date(Date.now() - CONNECT_LINK_TIMEOUT),
              ),
            ),
          )
          .returning({ id: connectionsTable.id });

        // TODO: Handle if any id doesn't exist.
        if (!updated) {
          throw new HTTPException(500, {
            message: "Failed to create connection",
          });
        }
      } else if (json.apiKey) {
        // TODO: Validate API Key for each integration type
        const [updated] = await connectDB
          .update(connectionsTable)
          .set({
            token: json.apiKey,
          })
          .where(
            and(
              eq(connectionsTable.linkId, c.req.param("link_id")),
              isNull(connectionsTable.token),
              gte(
                connectionsTable.initiatedAt,
                new Date(Date.now() - CONNECT_LINK_TIMEOUT),
              ),
            ),
          )
          .returning({ id: connectionsTable.id });

        // TODO: Handle if any id doesn't exist.
        if (!updated) {
          throw new HTTPException(500, {
            message: "Failed to create connection",
          });
        }
      } else {
        throw new HTTPException(400, {
          message:
            "Request body should either contain the `nangoConnectionId` or `apiKey` parameters.",
        });
      }

      return new Response(null, { status: 204 });
    },
  );

export type ConnectAPIType = typeof connectRouter;
