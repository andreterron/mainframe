import { Context } from "hono";
import {
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
  deleteCookie,
} from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { sessionsTable } from "../db/connect-db/connect-schema.ts";
import { connectDB } from "./connect-db.ts";
import { nanoid } from "nanoid";
import { LibsqlError } from "@libsql/client";

const COOKIE_NAME = "mfm_conn_session_id";
const COOKIE_MAX_AGE = 366 * 24 * 60 * 60;

export function getSessionFromCookie(c: Context) {
  if (!connectDB) {
    console.error("Missing connectDB");
    throw new HTTPException(500);
  }

  return getCookie(c, COOKIE_NAME);
}

export async function ensureSessionCookie(c: Context, appId: string) {
  if (!connectDB) {
    console.error("Missing connectDB");
    throw new HTTPException(500);
  }

  const sessionId = getCookie(c, COOKIE_NAME);
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

    setCookie(c, COOKIE_NAME, inserted.id, {
      maxAge: COOKIE_MAX_AGE,
      secure: true,
      sameSite: "Lax",
      httpOnly: true,
      // TODO: We might need to set the cookie to different domains
      // domain: ??
    });

    return inserted.id;
  } catch (e) {
    if (e instanceof LibsqlError && e.code === "SQLITE_CONSTRAINT") {
      throw new HTTPException(404, { message: "App ID not found" });
    }
    throw e;
  }
}
