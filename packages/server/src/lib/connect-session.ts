import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { sessionsTable } from "../db/connect-db/connect-schema.ts";
import { connectDB } from "./connect-db.ts";
import { nanoid } from "nanoid";
import { LibsqlError } from "@libsql/client";
import { parseBearerHeader } from "./parse-bearer-header.ts";
import { MAINFRAME_SESSION_HEADER } from "../utils/constants.ts";

function getSessionId(c: Context, options?: { authHeader?: string }) {
  const token = parseBearerHeader(
    c.req.header(options?.authHeader ?? "Authorization"),
  );
  return token;
}

export function getSessionFromContext(
  c: Context,
  options?: { authHeader?: string },
) {
  return getSessionId(c, options);
}

export async function ensureSession(
  c: Context,
  appId: string,
  options?: { authHeader?: string },
) {
  if (!connectDB) {
    console.error("Missing connectDB");
    throw new HTTPException(500);
  }

  const sessionId = getSessionId(c, options);
  if (sessionId) {
    return sessionId;
  }

  const id = `session_${nanoid()}`;

  try {
    const [inserted] = await connectDB
      .insert(sessionsTable)
      .values({
        id,
        appId: appId,
      })
      .returning({ id: sessionsTable.id });

    // TODO: Handle if appId doesn't exist
    if (!inserted) {
      throw new HTTPException(500, { message: "Failed to create session" });
    }

    c.res.headers.set(MAINFRAME_SESSION_HEADER, inserted.id);

    return inserted.id;
  } catch (e) {
    if (e instanceof LibsqlError && e.code === "SQLITE_CONSTRAINT") {
      throw new HTTPException(404, { message: "App ID not found" });
    }
    throw e;
  }
}
