import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { OperationsEmitter } from "./operations";

export interface MainframeContext {
  db: SqliteRemoteDatabase;
  operations?: OperationsEmitter;
  userId?: string;
}
