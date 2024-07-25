import { Context } from "hono";
import { Env } from "../../types.ts";
import { getSessionFromId, getSessionIdFromCookieHeader } from "../sessions.ts";
import { ensureDB } from "../../utils/ensure-db.ts";
import { parseBearerHeader } from "../parse-bearer-header.ts";

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
