import { sessionsTable } from "@mainframe-api/shared";
import { eq } from "drizzle-orm";
import { env } from "./env.server.ts";
import { CookieSerializeOptions, parse, serialize } from "cookie";
import cookieSignature from "cookie-signature";
import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { nanoid } from "nanoid";

export interface MainframeSession {
  id: string;
  data: {
    userId?: string;
    type?: "admin" | "api";
  };
  error?: "not_found";
}

const cookieNames: [string, ...string[]] = ["__session_mainframe", "__session"];
const cookieSettings: CookieSerializeOptions = {
  // path: "/",
  httpOnly: true,
  // maxAge: 400 days is to the maximum timespan available
  // https://developer.chrome.com/blog/cookie-max-age-expires/
  maxAge: 400 * 24 * 60 * 60,
  // TODO: secure is false since the default scenario is to use it over
  //       localhost or or over a home network
  // TODO: overwrite `secure` when using https.
  secure: false,
  path: "/",
};

// NOTE: Prefer using `getSessionFromCookies`. This function doesn't create a new session
//       if the request has no session. Useful for API requests.
export function getSessionIdFromCookieHeader(
  cookieHeader: string | null | undefined,
  cookieSecrets: string[] = env.COOKIE_SECRET ? [env.COOKIE_SECRET] : [],
) {
  if (!cookieHeader) {
    return null;
  }
  for (let cookieName of cookieNames) {
    const parsed = parse(cookieHeader, {
      decode(value) {
        for (let secret of cookieSecrets) {
          const unsigned = cookieSignature.unsign(value, secret);
          if (unsigned !== false) {
            return unsigned;
          }
        }
        return value;
      },
    })[cookieName] as string | undefined;
    // Ensures it's not an empty string or null
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function serializeSessionCookie(
  value: string,
  cookieSecrets: string[] = env.COOKIE_SECRET ? [env.COOKIE_SECRET] : [],
  options?: CookieSerializeOptions,
) {
  return serialize(cookieNames[0], value, {
    encode(value) {
      const secret = cookieSecrets.at(0);
      if (secret) {
        return cookieSignature.sign(value, secret);
      }
      return value;
    },
    ...cookieSettings,
    ...options,
  });
}

async function updateData(
  db: SqliteRemoteDatabase,
  id: string,
  data: MainframeSession["data"],
  expires: Date | undefined,
) {
  await db
    .update(sessionsTable)
    .set({
      userId: data.userId ?? null,
      type: data.type,
      expires: expires?.getTime() ?? null,
    })
    .where(eq(sessionsTable.id, id));
}

async function deleteData(db: SqliteRemoteDatabase, id: string) {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
}

async function createSession(
  db: SqliteRemoteDatabase,
): Promise<MainframeSession> {
  // TODO: Remove dynamic import
  const id = nanoid(32);
  await db.insert(sessionsTable).values({
    id,
    userId: null,
    expires: null,
  });
  return {
    id,
    data: {
      userId: undefined,
    },
  };
}

export async function getSessionFromId(
  db: SqliteRemoteDatabase,
  sessionId: string,
): Promise<MainframeSession | undefined> {
  const [row] = await db
    .select({ userId: sessionsTable.userId, type: sessionsTable.type })
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));

  if (!row) {
    return undefined;
  }

  return {
    id: sessionId,
    data: {
      userId: row.userId ?? undefined,
      type: row.type,
    },
  };
}

export async function getSessionFromIdOrCreate(
  db: SqliteRemoteDatabase,
  sessionId: string,
) {
  const session = await getSessionFromId(db, sessionId);

  return session ?? createSession(db);
}

export async function getSessionFromCookies(
  db: SqliteRemoteDatabase,
  cookieHeader?: string | null | undefined,
  cookieSecrets: string[] = env.COOKIE_SECRET ? [env.COOKIE_SECRET] : [],
  options?: any,
): Promise<MainframeSession> {
  const sessionId = getSessionIdFromCookieHeader(cookieHeader, cookieSecrets);

  if (!sessionId) {
    return createSession(db);
  }

  return getSessionFromIdOrCreate(db, sessionId);
}

export async function commitSession(
  session: MainframeSession,
  db: SqliteRemoteDatabase,
  cookieSecrets: string[] = env.COOKIE_SECRET ? [env.COOKIE_SECRET] : [],
  options?: CookieSerializeOptions,
) {
  // Update row
  let { id, data } = session;

  let expires =
    options?.maxAge != null
      ? new Date(Date.now() + options.maxAge * 1000)
      : options?.expires != null
      ? options.expires
      : cookieSettings.expires;

  await updateData(db, id, data, expires);

  let serializedCookie = serializeSessionCookie(
    session.id,
    cookieSecrets,
    options,
  );
  if (serializedCookie.length > 4096) {
    throw new Error(
      "Cookie length will exceed browser maximum. Length: " +
        serializedCookie.length,
    );
  }
  return serializedCookie;
}

export async function destroySession(
  session: MainframeSession,
  db: SqliteRemoteDatabase,
  cookieSecrets: string[] = env.COOKIE_SECRET ? [env.COOKIE_SECRET] : [],
  options?: CookieSerializeOptions,
) {
  // Delete row
  await deleteData(db, session.id);
  return serializeSessionCookie("", cookieSecrets, {
    ...options,
    maxAge: undefined,
    expires: new Date(0),
  });
}
