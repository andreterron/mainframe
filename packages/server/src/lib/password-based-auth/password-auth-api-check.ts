import { Context } from "hono";
import { Env } from "../../types.ts";
import { getSessionFromId, getSessionIdFromCookieHeader } from "../sessions.ts";
import { ensureDB } from "../../utils/ensure-db.ts";

export function parseBearerHeader(header: string | undefined) {
  if (!header) {
    return undefined;
  }

  const match = header.match(/^Bearer\s+(.*)$/);

  if (match) {
    return match[1];
  }
}

export async function isApiRequestAuthorizedForPasswordAuth<
  E extends Env = Env,
>(c: Context<E>): Promise<boolean> {
  ensureDB(c.var.db);
  const authorization = c.req.header("authorization");

  const bearer = parseBearerHeader(authorization);
  const sessionId =
    bearer ?? getSessionIdFromCookieHeader(c.req.header("cookie"));

  const session = sessionId
    ? await getSessionFromId(c.var.db, sessionId)
    : undefined;

  return !!session?.data.userId;
}
