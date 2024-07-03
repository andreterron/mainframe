import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { OperationsEmitter } from "./operations";
// TODO: Remove these imports
import { drizzle } from "drizzle-orm/libsql";
import { Client } from "@libsql/client";

export interface MainframeExternalContext {
  // TODO: Remove Client
  db: Client;
  operations?: OperationsEmitter;
  userId?: string;
}

export interface MainframeContext {
  db: SqliteRemoteDatabase;
  operations?: OperationsEmitter;
}

export function wrapExternalContext(
  ctx: MainframeExternalContext,
): MainframeContext {
  return {
    db: drizzle(ctx.db),
    operations: ctx.operations,
  };
}
